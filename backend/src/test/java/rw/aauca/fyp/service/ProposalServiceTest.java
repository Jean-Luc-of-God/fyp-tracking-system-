package rw.aauca.fyp.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import rw.aauca.fyp.entity.ProposalAttempt;
import rw.aauca.fyp.entity.Student;
import rw.aauca.fyp.entity.User;
import rw.aauca.fyp.enums.ProposalStatus;
import rw.aauca.fyp.enums.Role;
import rw.aauca.fyp.enums.StudentState;
import rw.aauca.fyp.repository.ProposalAttemptRepository;
import rw.aauca.fyp.repository.StudentRepository;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ProposalServiceTest {

    @Mock private StudentRepository studentRepository;
    @Mock private ProposalAttemptRepository proposalAttemptRepository;
    @Mock private StudentStateService stateService;
    @Mock private AuditService auditService;
    @Mock private EmailService emailService;

    @InjectMocks private ProposalService service;

    private User reviewer;
    private Student student;
    private UUID studentId;

    @BeforeEach
    void setUp() {
        studentId = UUID.randomUUID();

        reviewer = User.builder()
                .id(UUID.randomUUID())
                .email("hod@aauca.ac.rw")
                .role(Role.HOD)
                .build();

        student = Student.builder()
                .id(studentId)
                .state(StudentState.PROTOTYPE_GRANTED)
                .proposalLocked(false)
                .build();

        when(studentRepository.findById(studentId)).thenReturn(Optional.of(student));
        when(studentRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(proposalAttemptRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        // stateService.transition modifies the student in place — simulate that
        doAnswer(inv -> {
            Student s = inv.getArgument(0);
            StudentState to = inv.getArgument(1);
            s.setState(to);
            return s;
        }).when(stateService).transition(any(), any(), any(), any());
    }

    // ──────────────────────────────────────────────────────
    // submit()
    // ──────────────────────────────────────────────────────

    @Test
    void submit_fromPrototypeGranted_succeeds() {
        when(proposalAttemptRepository.findFirstByStudentIdAndStatus(studentId, ProposalStatus.PENDING))
                .thenReturn(Optional.empty());
        when(proposalAttemptRepository.countByStudentId(studentId)).thenReturn(0);

        ProposalAttempt result = service.submit(studentId, reviewer);

        assertThat(result.getAttemptNumber()).isEqualTo(1);
        assertThat(result.getStatus()).isEqualTo(ProposalStatus.PENDING);
        verify(stateService).transition(student, StudentState.PROPOSAL_UNDER_REVIEW, reviewer, "Proposal submitted");
    }

    @Test
    void submit_fromProposalUnderReview_allowed() {
        student.setState(StudentState.PROPOSAL_UNDER_REVIEW);
        when(proposalAttemptRepository.findFirstByStudentIdAndStatus(studentId, ProposalStatus.PENDING))
                .thenReturn(Optional.empty());
        when(proposalAttemptRepository.countByStudentId(studentId)).thenReturn(1);

        ProposalAttempt result = service.submit(studentId, reviewer);
        assertThat(result.getAttemptNumber()).isEqualTo(2);
    }

    @Test
    void submit_fromWrongState_throws() {
        student.setState(StudentState.REGISTERED);

        assertThatThrownBy(() -> service.submit(studentId, reviewer))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("PROTOTYPE_GRANTED");
    }

    @Test
    void submit_whenLocked_throws() {
        student.setProposalLocked(true);

        assertThatThrownBy(() -> service.submit(studentId, reviewer))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("locked");
    }

    @Test
    void submit_whenAlreadyPending_throws() {
        when(proposalAttemptRepository.findFirstByStudentIdAndStatus(studentId, ProposalStatus.PENDING))
                .thenReturn(Optional.of(new ProposalAttempt()));

        assertThatThrownBy(() -> service.submit(studentId, reviewer))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("already under review");
    }

    // ──────────────────────────────────────────────────────
    // review() — accept
    // ──────────────────────────────────────────────────────

    @Test
    void review_accept_transitionsToProposalAccepted() {
        student.setState(StudentState.PROPOSAL_UNDER_REVIEW);
        ProposalAttempt pending = ProposalAttempt.builder()
                .student(student).attemptNumber(1).status(ProposalStatus.PENDING).build();
        when(proposalAttemptRepository.findFirstByStudentIdAndStatus(studentId, ProposalStatus.PENDING))
                .thenReturn(Optional.of(pending));

        ProposalAttempt result = service.review(studentId, ProposalStatus.ACCEPTED, null, reviewer);

        assertThat(result.getStatus()).isEqualTo(ProposalStatus.ACCEPTED);
        verify(stateService).transition(student, StudentState.PROPOSAL_ACCEPTED, reviewer, "Proposal accepted");
    }

    @Test
    void review_withPendingDecision_throws() {
        assertThatThrownBy(() -> service.review(studentId, ProposalStatus.PENDING, null, reviewer))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void review_fromWrongState_throws() {
        student.setState(StudentState.SUPERVISION);

        assertThatThrownBy(() -> service.review(studentId, ProposalStatus.ACCEPTED, null, reviewer))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("no proposal currently under review");
    }

    // ──────────────────────────────────────────────────────
    // review() — reject and 3-attempt limit
    // ──────────────────────────────────────────────────────

    @Test
    void review_reject_requiresReason() {
        student.setState(StudentState.PROPOSAL_UNDER_REVIEW);
        ProposalAttempt pending = ProposalAttempt.builder()
                .student(student).attemptNumber(1).status(ProposalStatus.PENDING).build();
        when(proposalAttemptRepository.findFirstByStudentIdAndStatus(studentId, ProposalStatus.PENDING))
                .thenReturn(Optional.of(pending));
        when(proposalAttemptRepository.countByStudentIdAndStatus(studentId, ProposalStatus.REJECTED))
                .thenReturn(1);

        assertThatThrownBy(() -> service.review(studentId, ProposalStatus.REJECTED, null, reviewer))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("rejection reason");
    }

    @Test
    void firstRejection_doesNotLock() {
        student.setState(StudentState.PROPOSAL_UNDER_REVIEW);
        ProposalAttempt pending = ProposalAttempt.builder()
                .student(student).attemptNumber(1).status(ProposalStatus.PENDING).build();
        when(proposalAttemptRepository.findFirstByStudentIdAndStatus(studentId, ProposalStatus.PENDING))
                .thenReturn(Optional.of(pending));
        when(proposalAttemptRepository.countByStudentIdAndStatus(studentId, ProposalStatus.REJECTED))
                .thenReturn(1); // 1 total (current attempt auto-flushed before count)

        service.review(studentId, ProposalStatus.REJECTED, "Needs more research", reviewer);

        assertThat(student.isProposalLocked()).isFalse();
    }

    @Test
    void secondRejection_doesNotLock() {
        student.setState(StudentState.PROPOSAL_UNDER_REVIEW);
        ProposalAttempt pending = ProposalAttempt.builder()
                .student(student).attemptNumber(2).status(ProposalStatus.PENDING).build();
        when(proposalAttemptRepository.findFirstByStudentIdAndStatus(studentId, ProposalStatus.PENDING))
                .thenReturn(Optional.of(pending));
        when(proposalAttemptRepository.countByStudentIdAndStatus(studentId, ProposalStatus.REJECTED))
                .thenReturn(2); // 2 total (1 previous + current auto-flushed)

        service.review(studentId, ProposalStatus.REJECTED, "Still needs work", reviewer);

        assertThat(student.isProposalLocked()).isFalse();
    }

    @Test
    void thirdRejection_locksProposalSubmission() {
        student.setState(StudentState.PROPOSAL_UNDER_REVIEW);
        ProposalAttempt pending = ProposalAttempt.builder()
                .student(student).attemptNumber(3).status(ProposalStatus.PENDING).build();
        when(proposalAttemptRepository.findFirstByStudentIdAndStatus(studentId, ProposalStatus.PENDING))
                .thenReturn(Optional.of(pending));
        when(proposalAttemptRepository.countByStudentIdAndStatus(studentId, ProposalStatus.REJECTED))
                .thenReturn(3); // 3 total (2 previous + current auto-flushed) → lock

        service.review(studentId, ProposalStatus.REJECTED, "Final rejection", reviewer);

        assertThat(student.isProposalLocked()).isTrue();
        verify(studentRepository).save(student);
        verify(emailService).notifyProposalLocked(any(), any());
    }

    @Test
    void submitAfterLock_throws() {
        student.setState(StudentState.PROTOTYPE_GRANTED);
        student.setProposalLocked(true);

        assertThatThrownBy(() -> service.submit(studentId, reviewer))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("locked");
    }

    // ──────────────────────────────────────────────────────
    // unlock()
    // ──────────────────────────────────────────────────────

    @Test
    void unlock_clearsLockedFlag() {
        student.setProposalLocked(true);

        Student result = service.unlock(studentId, reviewer);

        assertThat(result.isProposalLocked()).isFalse();
        verify(studentRepository).save(student);
        verify(emailService).notifyProposalUnlocked(any(), any());
    }

    @Test
    void unlock_whenNotLocked_throws() {
        student.setProposalLocked(false);

        assertThatThrownBy(() -> service.unlock(studentId, reviewer))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("not currently locked");
    }
}
