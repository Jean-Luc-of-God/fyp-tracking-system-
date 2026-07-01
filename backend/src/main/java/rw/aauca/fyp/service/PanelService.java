package rw.aauca.fyp.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rw.aauca.fyp.entity.PanelAssignment;
import rw.aauca.fyp.entity.Student;
import rw.aauca.fyp.entity.User;
import rw.aauca.fyp.enums.PanelOutcome;
import rw.aauca.fyp.enums.PanelType;
import rw.aauca.fyp.enums.Role;
import rw.aauca.fyp.enums.StudentState;
import rw.aauca.fyp.repository.PanelAssignmentRepository;
import rw.aauca.fyp.repository.StudentRepository;
import rw.aauca.fyp.repository.UserRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PanelService {

    private final PanelAssignmentRepository panelRepository;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final StudentStateService stateService;
    private final AuditService auditService;
    private final EmailService emailService;

    @Transactional
    public PanelAssignment assign(UUID studentId, UUID examinerId, PanelType panelType,
                                   Instant scheduledAt, User actor) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));

        User examiner = userRepository.findById(examinerId)
                .orElseThrow(() -> new RuntimeException("Examiner not found: " + examinerId));

        if (!examiner.isEligibleExaminer()) {
            throw new IllegalArgumentException(examiner.getFullName() + " is not marked as an eligible examiner");
        }

        // Examiner cannot be the student's own supervisor
        if (student.getSupervisor() != null &&
                student.getSupervisor().getId().equals(examinerId)) {
            throw new IllegalArgumentException(
                    "A supervisor cannot be assigned as examiner for their own student");
        }

        // Prevent a second pending assignment of the same type (re-defense attempts are fine
        // once the prior attempt's outcome has been recorded)
        if (panelRepository.existsByStudentIdAndPanelTypeAndOutcomeIsNull(studentId, panelType)) {
            throw new IllegalStateException(
                    "A pending " + panelType + " assignment already exists for this student");
        }

        // An examiner cannot examine the same student at both pre-defense and defense —
        // but the same examiner may re-examine a later defense attempt
        if (panelRepository.existsByStudentIdAndExaminerIdAndPanelTypeNot(studentId, examinerId, panelType)) {
            throw new IllegalStateException(
                    examiner.getFullName() + " already examined this student at a different panel stage "
                            + "and cannot examine them again");
        }

        int attemptNumber = panelType == PanelType.DEFENSE ? student.getDefenseAttempts() + 1 : 1;

        PanelAssignment assignment = PanelAssignment.builder()
                .student(student)
                .examiner(examiner)
                .panelType(panelType)
                .scheduledAt(scheduledAt)
                .attemptNumber(attemptNumber)
                .assignedBy(actor)
                .build();

        auditService.log(actor, "PANEL_EXAMINER_ASSIGNED", "PanelAssignment", null,
                examiner.getFullName() + " assigned to " + panelType + " for student " + student.getRegNumber(), null);

        PanelAssignment saved = panelRepository.save(assignment);
        String scheduledDisplay = scheduledAt != null ? scheduledAt.toString() : null;
        emailService.notifyPanelAssigned(examiner, student, panelType.name(), scheduledDisplay);
        return saved;
    }

    @Transactional
    public PanelAssignment updateSchedule(UUID assignmentId, Instant scheduledAt, User examiner) {
        PanelAssignment assignment = panelRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Panel assignment not found: " + assignmentId));

        if (!assignment.getExaminer().getId().equals(examiner.getId())) {
            throw new SecurityException("You can only set the schedule for panels you are assigned to");
        }
        if (assignment.getOutcome() != null) {
            throw new IllegalStateException("Cannot reschedule a panel whose outcome has already been recorded");
        }

        assignment.setScheduledAt(scheduledAt);
        PanelAssignment saved = panelRepository.save(assignment);

        auditService.log(examiner, "PANEL_RESCHEDULED", "PanelAssignment", assignmentId,
                "Scheduled for " + scheduledAt, null);
        emailService.notifyPanelScheduled(assignment.getStudent().getUser(), assignment.getStudent(),
                assignment.getPanelType().name(), examiner.getFullName(), scheduledAt.toString());

        return saved;
    }

    @Transactional
    public PanelAssignment recordOutcome(UUID assignmentId, PanelOutcome outcome, String note, User actor) {
        PanelAssignment assignment = panelRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Panel assignment not found: " + assignmentId));

        // Non-administrative roles (EXAMINER, SUPERVISOR) can only record outcomes on their own
        // assignments — HOD/FACILITATOR/SUPERADMIN retain administrative override authority.
        boolean isAdministrative = actor.getRole() == Role.HOD
                || actor.getRole() == Role.FACILITATOR
                || actor.getRole() == Role.SUPERADMIN;
        if (!isAdministrative && !assignment.getExaminer().getId().equals(actor.getId())) {
            throw new SecurityException("You can only record outcomes for panels you are assigned to");
        }

        if (assignment.getOutcome() != null) {
            throw new IllegalStateException("Outcome has already been recorded for this panel assignment");
        }

        // Validate outcome is appropriate for panel type
        if (assignment.getPanelType() == PanelType.PRE_DEFENSE && outcome != PanelOutcome.CLEARED) {
            throw new IllegalArgumentException("Pre-defense outcome must be CLEARED");
        }
        if (assignment.getPanelType() == PanelType.DEFENSE && outcome == PanelOutcome.CLEARED) {
            throw new IllegalArgumentException("Defense outcome must be PASSED, REFERRED, or FAILED");
        }

        assignment.setOutcome(outcome);
        assignment.setOutcomeNote(note);
        assignment.setOutcomeRecordedAt(Instant.now());

        // Auto-trigger state transitions where unambiguous
        Student student = assignment.getStudent();
        if (assignment.getPanelType() == PanelType.PRE_DEFENSE
                && outcome == PanelOutcome.CLEARED
                && student.getState() == StudentState.PRE_DEFENSE) {
            stateService.transition(student, StudentState.DEFENSE, actor, "Pre-defense cleared by " + actor.getFullName());
        } else if (assignment.getPanelType() == PanelType.DEFENSE
                && outcome == PanelOutcome.PASSED
                && student.getState() == StudentState.DEFENSE) {
            stateService.transition(student, StudentState.COMPLETED, actor, "Defense passed — recorded by " + actor.getFullName());
        } else if (assignment.getPanelType() == PanelType.DEFENSE
                && (outcome == PanelOutcome.REFERRED || outcome == PanelOutcome.FAILED)
                && student.getState() == StudentState.DEFENSE) {
            stateService.transition(student, StudentState.DEFENSE, actor,
                    "Defense outcome: " + outcome + " — re-defense required");
        }

        auditService.log(actor, "PANEL_OUTCOME_RECORDED", "PanelAssignment", assignmentId,
                assignment.getPanelType() + " outcome: " + outcome, null);

        PanelAssignment result = panelRepository.save(assignment);
        if (student.getUser() != null) {
            emailService.notifyPanelOutcome(student.getUser(), student,
                    assignment.getPanelType().name(), outcome.name(), note);
        }
        return result;
    }

    @Transactional
    public void removeAssignment(UUID assignmentId, User actor) {
        PanelAssignment assignment = panelRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Panel assignment not found: " + assignmentId));

        if (assignment.getOutcome() != null) {
            throw new IllegalStateException("Cannot remove a panel assignment once an outcome has been recorded");
        }

        auditService.log(actor, "PANEL_EXAMINER_REMOVED", "PanelAssignment", assignmentId,
                assignment.getExaminer().getFullName() + " removed from " + assignment.getPanelType()
                        + " panel for student " + assignment.getStudent().getRegNumber(), null);

        panelRepository.delete(assignment);
    }

    public List<PanelAssignment> getByStudent(UUID studentId) {
        return panelRepository.findByStudentIdOrderByAssignedAtAsc(studentId);
    }

    /** Throws AccessDeniedException if the authenticated student does not own this student record. */
    public void assertStudentOwnership(UUID studentId, User actor) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        if (student.getUser() == null || !student.getUser().getId().equals(actor.getId())) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "You may only view your own records");
        }
    }

    public List<PanelAssignment> getMyAssignments(UUID examinerId) {
        return panelRepository.findByExaminerIdOrderByAssignedAtAsc(examinerId);
    }
}
