package rw.aauca.fyp.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import rw.aauca.fyp.entity.ProposalAttempt;
import rw.aauca.fyp.entity.Student;
import rw.aauca.fyp.entity.User;
import rw.aauca.fyp.enums.ProposalStatus;
import rw.aauca.fyp.enums.StudentState;
import rw.aauca.fyp.repository.ProposalAttemptRepository;
import rw.aauca.fyp.repository.StudentRepository;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProposalService {

    private final StudentRepository studentRepository;
    private final ProposalAttemptRepository proposalAttemptRepository;
    private final StudentStateService stateService;
    private final AuditService auditService;
    private final EmailService emailService;

    private static final int MAX_REJECTIONS = 3;

    @Transactional
    public ProposalAttempt submit(UUID studentId, User actor, MultipartFile file) throws IOException {
        Student student = findStudent(studentId);

        if (student.getState() != StudentState.PROTOTYPE_GRANTED &&
                student.getState() != StudentState.PROPOSAL_UNDER_REVIEW) {
            throw new IllegalStateException(
                    "Proposal can only be submitted from PROTOTYPE_GRANTED or PROPOSAL_UNDER_REVIEW state");
        }

        if (student.isProposalLocked()) {
            throw new IllegalStateException(
                    "Proposal submission is locked for this student; the HOD must grant an additional slot");
        }

        proposalAttemptRepository.findFirstByStudentIdAndStatus(studentId, ProposalStatus.PENDING)
                .ifPresent(a -> { throw new IllegalStateException("A proposal is already under review"); });

        stateService.transition(student, StudentState.PROPOSAL_UNDER_REVIEW, actor, "Proposal submitted");

        int nextAttempt = proposalAttemptRepository.countByStudentId(studentId) + 1;

        ProposalAttempt attempt = ProposalAttempt.builder()
                .student(student)
                .attemptNumber(nextAttempt)
                .status(ProposalStatus.PENDING)
                .build();

        if (file != null && !file.isEmpty()) {
            Path uploadDir = Paths.get("uploads/proposals/" + studentId + "/attempt-" + nextAttempt);
            Files.createDirectories(uploadDir);
            String safeName = (file.getOriginalFilename() != null ? file.getOriginalFilename() : "proposal")
                    .replaceAll("[^a-zA-Z0-9._-]", "_");
            file.transferTo(uploadDir.resolve(safeName));
            attempt.setProposalFileName(safeName);
        }

        auditService.log(actor, "PROPOSAL_SUBMITTED", "Student", studentId,
                "Attempt " + nextAttempt, null);

        if (student.getSupervisor() != null) {
            emailService.notifyProposalSubmitted(student.getSupervisor(), student, nextAttempt);
        }

        return proposalAttemptRepository.save(attempt);
    }

    @Transactional
    public ProposalAttempt review(UUID studentId, ProposalStatus decision, String rejectionReason, User reviewer) {
        if (decision == ProposalStatus.PENDING) {
            throw new IllegalArgumentException("Decision must be ACCEPTED or REJECTED");
        }

        Student student = findStudent(studentId);

        if (student.getState() != StudentState.PROPOSAL_UNDER_REVIEW) {
            throw new IllegalStateException("Student has no proposal currently under review");
        }

        ProposalAttempt attempt = proposalAttemptRepository
                .findFirstByStudentIdAndStatus(studentId, ProposalStatus.PENDING)
                .orElseThrow(() -> new IllegalStateException("No pending proposal attempt found for this student"));

        attempt.setStatus(decision);
        attempt.setReviewedBy(reviewer);
        attempt.setReviewedAt(Instant.now());

        if (decision == ProposalStatus.ACCEPTED) {
            stateService.transition(student, StudentState.PROPOSAL_ACCEPTED, reviewer, "Proposal accepted");
            auditService.log(reviewer, "PROPOSAL_ACCEPTED", "Student", studentId,
                    "Attempt " + attempt.getAttemptNumber(), null);
            emailService.notifyProposalAccepted(student.getUser(), student);
        } else {
            if (rejectionReason == null || rejectionReason.isBlank()) {
                throw new IllegalArgumentException("A rejection reason is required");
            }
            attempt.setRejectionReason(rejectionReason);

            // Hibernate auto-flushes the dirty attempt before the count query,
            // so the count already includes the current rejection — no +1 needed.
            int totalRejections = proposalAttemptRepository
                    .countByStudentIdAndStatus(studentId, ProposalStatus.REJECTED);

            boolean nowLocked = totalRejections >= MAX_REJECTIONS;
            if (nowLocked) {
                student.setProposalLocked(true);
                studentRepository.save(student);
            }

            int remaining = Math.max(0, MAX_REJECTIONS - totalRejections);
            auditService.log(reviewer, "PROPOSAL_REJECTED", "Student", studentId,
                    "Attempt " + attempt.getAttemptNumber() + " — " + rejectionReason, null);
            emailService.notifyProposalRejected(student.getUser(), student,
                    attempt.getAttemptNumber(), rejectionReason, remaining);

            if (nowLocked) {
                emailService.notifyProposalLocked(student.getUser(), student);
            }
        }

        return proposalAttemptRepository.save(attempt);
    }

    @Transactional
    public Student unlock(UUID studentId, User hod) {
        Student student = findStudent(studentId);

        if (!student.isProposalLocked()) {
            throw new IllegalStateException("Student's proposal submission is not currently locked");
        }

        student.setProposalLocked(false);
        auditService.log(hod, "PROPOSAL_UNLOCKED", "Student", studentId,
                "HOD granted an additional proposal slot", null);
        Student saved = studentRepository.save(student);
        emailService.notifyProposalUnlocked(student.getUser(), saved);
        return saved;
    }

    public List<ProposalAttempt> getHistory(UUID studentId) {
        return proposalAttemptRepository.findByStudentIdOrderByAttemptNumberAsc(studentId);
    }

    public Path getLatestProposalFile(UUID studentId) {
        List<ProposalAttempt> attempts = proposalAttemptRepository
                .findByStudentIdOrderByAttemptNumberAsc(studentId);
        for (int i = attempts.size() - 1; i >= 0; i--) {
            ProposalAttempt a = attempts.get(i);
            if (a.getProposalFileName() != null) {
                return Paths.get("uploads/proposals/" + studentId
                        + "/attempt-" + a.getAttemptNumber()
                        + "/" + a.getProposalFileName());
            }
        }
        return null;
    }

    private Student findStudent(UUID studentId) {
        return studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));
    }
}
