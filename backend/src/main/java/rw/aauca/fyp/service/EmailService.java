package rw.aauca.fyp.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import rw.aauca.fyp.entity.NotificationLog;
import rw.aauca.fyp.entity.Student;
import rw.aauca.fyp.entity.User;
import rw.aauca.fyp.enums.NotificationStatus;
import rw.aauca.fyp.repository.NotificationLogRepository;
import rw.aauca.fyp.repository.StudentRepository;
import rw.aauca.fyp.repository.UserRepository;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final NotificationLogRepository notificationLogRepository;
    private final UserRepository userRepository;
    private final StudentRepository studentRepository;

    @Value("${spring.mail.username:noreply@aauca.ac.rw}")
    private String fromAddress;

    /**
     * Sends an email asynchronously and logs the result to notification_logs.
     * Called after the main transaction commits so a rollback won't orphan a sent email.
     */
    @Async
    public void send(String templateKey, UUID recipientId, UUID studentId, String subject, String body) {
        User recipient = userRepository.findById(recipientId).orElse(null);
        if (recipient == null) {
            log.warn("EmailService: recipient {} not found, skipping notification '{}'", recipientId, templateKey);
            return;
        }

        Student student = studentId != null ? studentRepository.findById(studentId).orElse(null) : null;

        NotificationLog entry = notificationLogRepository.save(
                NotificationLog.builder()
                        .templateKey(templateKey)
                        .recipient(recipient)
                        .student(student)
                        .subject(subject)
                        .body(body)
                        .status(NotificationStatus.PENDING)
                        .build()
        );

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(recipient.getEmail());
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);

            entry.setStatus(NotificationStatus.SENT);
            entry.setSentAt(Instant.now());
            log.debug("Email '{}' sent to {}", templateKey, recipient.getEmail());
        } catch (Exception e) {
            entry.setStatus(NotificationStatus.FAILED);
            entry.setErrorMessage(e.getMessage());
            entry.setRetryCount(entry.getRetryCount() + 1);
            log.error("Email '{}' to {} failed: {}", templateKey, recipient.getEmail(), e.getMessage());
        }

        notificationLogRepository.save(entry);
    }

    // ── Template helpers ─────────────────────────────────────────────────────

    public void notifyStateTransition(User recipient, Student student, String newState, String extraNote) {
        String subject = "[FYP] Your project status has been updated — " + friendlyState(newState);
        String body = "Dear " + recipient.getFullName() + ",\n\n"
                + "Your FYP status has been updated to: " + friendlyState(newState) + ".\n"
                + (extraNote != null && !extraNote.isBlank() ? "\nNote: " + extraNote + "\n" : "")
                + "\nLog in to the FYP portal to view full details.\n\n"
                + "AUCA FYP Office";
        send("STATE_TRANSITION_" + newState, recipient.getId(), student.getId(), subject, body);
    }

    public void notifyProposalSubmitted(User supervisor, Student student, int attemptNumber) {
        String subject = "[FYP] Proposal submission awaiting your review — " + student.getUser().getFullName();
        String body = "Dear " + supervisor.getFullName() + ",\n\n"
                + student.getUser().getFullName() + " (" + student.getRegNumber() + ") has submitted "
                + "their research proposal (attempt " + attemptNumber + ") and it is now pending review.\n\n"
                + "Please log in to the FYP portal to review and respond.\n\n"
                + "AUCA FYP Office";
        send("PROPOSAL_SUBMITTED", supervisor.getId(), student.getId(), subject, body);
    }

    public void notifyProposalAccepted(User student, Student studentRecord) {
        String subject = "[FYP] Your proposal has been accepted!";
        String body = "Dear " + student.getFullName() + ",\n\n"
                + "Congratulations! Your research proposal has been reviewed and accepted.\n"
                + "You will now move into the supervision phase. Please coordinate with your "
                + "assigned supervisor to begin regular meetings.\n\n"
                + "AUCA FYP Office";
        send("PROPOSAL_ACCEPTED", student.getId(), studentRecord.getId(), subject, body);
    }

    public void notifyProposalRejected(User student, Student studentRecord, int attemptNumber,
                                        String reason, int remaining) {
        String subject = "[FYP] Your proposal has been returned for revision (attempt " + attemptNumber + ")";
        String body = "Dear " + student.getFullName() + ",\n\n"
                + "Your research proposal (attempt " + attemptNumber + ") has been reviewed and requires revision.\n\n"
                + "Reviewer feedback:\n" + reason + "\n\n"
                + "You have " + remaining + " submission attempt(s) remaining.\n"
                + "Please address the feedback and resubmit through the FYP portal.\n\n"
                + "AUCA FYP Office";
        send("PROPOSAL_REJECTED", student.getId(), studentRecord.getId(), subject, body);
    }

    public void notifyProposalLocked(User student, Student studentRecord) {
        String subject = "[FYP] Proposal submissions locked — please contact the HOD";
        String body = "Dear " + student.getFullName() + ",\n\n"
                + "You have reached the maximum number of proposal submission attempts (3).\n"
                + "Your proposal submissions are now locked.\n\n"
                + "Please contact the Head of Department (HOD) if you wish to request an additional slot.\n\n"
                + "AUCA FYP Office";
        send("PROPOSAL_LOCKED", student.getId(), studentRecord.getId(), subject, body);
    }

    public void notifyProposalUnlocked(User student, Student studentRecord) {
        String subject = "[FYP] Proposal submission unlocked by HOD";
        String body = "Dear " + student.getFullName() + ",\n\n"
                + "The Head of Department has granted you an additional proposal submission slot.\n"
                + "You may now resubmit your proposal through the FYP portal.\n\n"
                + "AUCA FYP Office";
        send("PROPOSAL_UNLOCKED", student.getId(), studentRecord.getId(), subject, body);
    }

    public void notifyPanelAssigned(User examiner, Student student, String panelType, String scheduledAt) {
        String subject = "[FYP] Panel assignment — " + panelType + " for " + student.getUser().getFullName();
        String body = "Dear " + examiner.getFullName() + ",\n\n"
                + "You have been assigned as an examiner for the following student's "
                + panelType.replace("_", "-") + " panel:\n\n"
                + "  Student: " + student.getUser().getFullName() + " (" + student.getRegNumber() + ")\n"
                + (scheduledAt != null ? "  Scheduled: " + scheduledAt + "\n" : "")
                + "\nPlease log in to the FYP portal to view full details.\n\n"
                + "AUCA FYP Office";
        send("PANEL_ASSIGNED", examiner.getId(), student.getId(), subject, body);
    }

    public void notifyPanelOutcome(User studentUser, Student student, String panelType, String outcome,
                                    String note) {
        String subject = "[FYP] " + panelType.replace("_", "-") + " outcome: " + friendlyOutcome(outcome);
        String body = "Dear " + studentUser.getFullName() + ",\n\n"
                + "The outcome for your " + panelType.replace("_", "-") + " panel has been recorded:\n\n"
                + "  Outcome: " + friendlyOutcome(outcome) + "\n"
                + (note != null && !note.isBlank() ? "  Note: " + note + "\n" : "")
                + "\nPlease log in to the FYP portal for further instructions.\n\n"
                + "AUCA FYP Office";
        send("PANEL_OUTCOME_" + outcome, studentUser.getId(), student.getId(), subject, body);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private String friendlyState(String state) {
        return switch (state) {
            case "REGISTERED"            -> "Registered";
            case "CASE_LETTER_SUBMITTED" -> "Case Letter Submitted";
            case "CASE_LETTER_APPROVED"  -> "Case Letter Approved";
            case "PROTOTYPE_REVIEW"      -> "Prototype Review";
            case "PROTOTYPE_GRANTED"     -> "Prototype Approved";
            case "PROPOSAL_UNDER_REVIEW" -> "Proposal Under Review";
            case "PROPOSAL_ACCEPTED"     -> "Proposal Accepted";
            case "SUPERVISION"           -> "Supervision Phase";
            case "BOOK_SUBMITTED"        -> "Book Submitted";
            case "PRE_DEFENSE"           -> "Pre-Defense";
            case "DEFENSE"               -> "Final Defense";
            case "COMPLETED"             -> "Completed";
            case "WITHDRAWN"             -> "Withdrawn";
            default                      -> state;
        };
    }

    private String friendlyOutcome(String outcome) {
        return switch (outcome) {
            case "CLEARED"  -> "Cleared";
            case "PASSED"   -> "Passed";
            case "REFERRED" -> "Referred — further work required";
            case "FAILED"   -> "Failed";
            default         -> outcome;
        };
    }
}
