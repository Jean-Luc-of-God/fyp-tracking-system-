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

        if (examiner.getRole() != Role.EXAMINER) {
            throw new IllegalArgumentException("User " + examiner.getFullName() + " does not have the EXAMINER role");
        }

        // Examiner cannot be the student's own supervisor
        if (student.getSupervisor() != null &&
                student.getSupervisor().getId().equals(examinerId)) {
            throw new IllegalArgumentException(
                    "A supervisor cannot be assigned as examiner for their own student");
        }

        // Prevent duplicate assignment (same student + examiner + panel type)
        if (panelRepository.existsByStudentIdAndExaminerIdAndPanelType(studentId, examinerId, panelType)) {
            throw new IllegalStateException(
                    examiner.getFullName() + " is already assigned to this student's " + panelType + " panel");
        }

        PanelAssignment assignment = PanelAssignment.builder()
                .student(student)
                .examiner(examiner)
                .panelType(panelType)
                .scheduledAt(scheduledAt)
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
    public PanelAssignment recordOutcome(UUID assignmentId, PanelOutcome outcome, String note, User actor) {
        PanelAssignment assignment = panelRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Panel assignment not found: " + assignmentId));

        // EXAMINER can only record outcomes on their own assignments
        if (actor.getRole() == Role.EXAMINER &&
                !assignment.getExaminer().getId().equals(actor.getId())) {
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
