package rw.aauca.fyp.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import rw.aauca.fyp.entity.Student;
import rw.aauca.fyp.entity.User;
import rw.aauca.fyp.enums.Role;
import rw.aauca.fyp.enums.StudentState;
import rw.aauca.fyp.exception.InvalidStateTransitionException;
import rw.aauca.fyp.repository.StateTransitionRepository;
import rw.aauca.fyp.repository.StudentRepository;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class StudentStateServiceTest {

    @Mock private StudentRepository studentRepository;
    @Mock private StateTransitionRepository transitionRepository;
    @Mock private AuditService auditService;
    @Mock private EmailService emailService;

    @InjectMocks private StudentStateService service;

    private User actor;
    private Student student;

    @BeforeEach
    void setUp() {
        actor = User.builder()
                .id(UUID.randomUUID())
                .email("hod@aauca.ac.rw")
                .role(Role.HOD)
                .build();

        student = Student.builder()
                .id(UUID.randomUUID())
                .state(StudentState.REGISTERED)
                .build();

        // Return the saved student as-is
        when(studentRepository.save(any(Student.class))).thenAnswer(i -> i.getArgument(0));
    }

    // ──────────────────────────────────────────────────────
    // Happy-path: every valid forward transition
    // ──────────────────────────────────────────────────────

    @Test
    void registeredToCaseLetterSubmitted() {
        Student result = service.transition(student, StudentState.CASE_LETTER_SUBMITTED, actor, null);
        assertThat(result.getState()).isEqualTo(StudentState.CASE_LETTER_SUBMITTED);
    }

    @Test
    void fullLinearChain_registeredToCompleted() {
        StudentState[] chain = {
            StudentState.CASE_LETTER_SUBMITTED,
            StudentState.CASE_LETTER_APPROVED,
            StudentState.PROTOTYPE_REVIEW,
            StudentState.PROTOTYPE_GRANTED,
            StudentState.PROPOSAL_UNDER_REVIEW,
            StudentState.PROPOSAL_ACCEPTED,
            StudentState.SUPERVISION,
            StudentState.BOOK_SUBMITTED,
            StudentState.PRE_DEFENSE,
            StudentState.DEFENSE,
            StudentState.COMPLETED,
        };
        for (StudentState next : chain) {
            student = service.transition(student, next, actor, null);
        }
        assertThat(student.getState()).isEqualTo(StudentState.COMPLETED);
    }

    @Test
    void prototypeReviewSelfLoop_incrementsAttempts() {
        student.setState(StudentState.PROTOTYPE_REVIEW);
        service.transition(student, StudentState.PROTOTYPE_REVIEW, actor, "re-present");
        assertThat(student.getProtoAttempts()).isEqualTo(1);
        service.transition(student, StudentState.PROTOTYPE_REVIEW, actor, "re-present again");
        assertThat(student.getProtoAttempts()).isEqualTo(2);
    }

    @Test
    void proposalUnderReviewSelfLoop_isAllowed() {
        student.setState(StudentState.PROPOSAL_UNDER_REVIEW);
        Student result = service.transition(student, StudentState.PROPOSAL_UNDER_REVIEW, actor, "re-submit");
        assertThat(result.getState()).isEqualTo(StudentState.PROPOSAL_UNDER_REVIEW);
    }

    // ──────────────────────────────────────────────────────
    // WITHDRAWN: allowed from any non-terminal state
    // ──────────────────────────────────────────────────────

    @ParameterizedTest
    @EnumSource(value = StudentState.class, names = {"COMPLETED", "WITHDRAWN"}, mode = EnumSource.Mode.EXCLUDE)
    void withdrawFromNonTerminalState_succeeds(StudentState from) {
        student.setState(from);
        Student result = service.transition(student, StudentState.WITHDRAWN, actor, "withdrawn");
        assertThat(result.getState()).isEqualTo(StudentState.WITHDRAWN);
    }

    @Test
    void withdrawFromCompleted_throws() {
        student.setState(StudentState.COMPLETED);
        assertThatThrownBy(() -> service.transition(student, StudentState.WITHDRAWN, actor, null))
                .isInstanceOf(InvalidStateTransitionException.class)
                .hasMessageContaining("COMPLETED");
    }

    @Test
    void withdrawFromWithdrawn_throws() {
        student.setState(StudentState.WITHDRAWN);
        assertThatThrownBy(() -> service.transition(student, StudentState.WITHDRAWN, actor, null))
                .isInstanceOf(InvalidStateTransitionException.class)
                .hasMessageContaining("WITHDRAWN");
    }

    // ──────────────────────────────────────────────────────
    // Invalid transitions
    // ──────────────────────────────────────────────────────

    @Test
    void skipAheadFromRegistered_throws() {
        assertThatThrownBy(() -> service.transition(student, StudentState.DEFENSE, actor, null))
                .isInstanceOf(InvalidStateTransitionException.class);
    }

    @Test
    void backwardsTransition_throws() {
        student.setState(StudentState.SUPERVISION);
        assertThatThrownBy(() -> service.transition(student, StudentState.REGISTERED, actor, null))
                .isInstanceOf(InvalidStateTransitionException.class);
    }

    @Test
    void completedIsTerminal_noFurtherTransitions() {
        student.setState(StudentState.COMPLETED);
        assertThatThrownBy(() -> service.transition(student, StudentState.DEFENSE, actor, null))
                .isInstanceOf(InvalidStateTransitionException.class);
    }

    @Test
    void registeredToProposalUnderReview_throws() {
        // Must go through case letter and prototype first
        assertThatThrownBy(() -> service.transition(student, StudentState.PROPOSAL_UNDER_REVIEW, actor, null))
                .isInstanceOf(InvalidStateTransitionException.class);
    }

    @Test
    void supervisionToPreDefenseWithoutBookSubmitted_throws() {
        student.setState(StudentState.SUPERVISION);
        assertThatThrownBy(() -> service.transition(student, StudentState.PRE_DEFENSE, actor, null))
                .isInstanceOf(InvalidStateTransitionException.class);
    }

    // ──────────────────────────────────────────────────────
    // Error message quality
    // ──────────────────────────────────────────────────────

    @Test
    void exceptionMessageContainsBothStates() {
        assertThatThrownBy(() -> service.transition(student, StudentState.COMPLETED, actor, null))
                .isInstanceOf(InvalidStateTransitionException.class)
                .hasMessageContaining("REGISTERED")
                .hasMessageContaining("COMPLETED");
    }
}
