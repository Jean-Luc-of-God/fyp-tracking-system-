package rw.aauca.fyp.integration;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import rw.aauca.fyp.entity.PanelAssignment;
import rw.aauca.fyp.entity.Student;
import rw.aauca.fyp.entity.User;
import rw.aauca.fyp.enums.*;
import rw.aauca.fyp.exception.InvalidStateTransitionException;
import rw.aauca.fyp.repository.*;
import rw.aauca.fyp.service.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Integration tests for the student state machine.
 * Runs against the real PostgreSQL database (dev instance) with @Transactional rollback
 * after each test so no data is left behind.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class StateMachineIntegrationTest {

    // EmailService and JwtBlacklistService are mocked to avoid SMTP and Redis dependencies
    @MockBean EmailService emailService;
    @MockBean JwtBlacklistService jwtBlacklistService;

    @Autowired UserRepository userRepository;
    @Autowired StudentRepository studentRepository;
    @Autowired StateTransitionRepository transitionRepository;
    @Autowired ProposalAttemptRepository proposalAttemptRepository;
    @Autowired PanelAssignmentRepository panelRepository;

    @Autowired StudentStateService stateService;
    @Autowired ProposalService proposalService;
    @Autowired PanelService panelService;

    @PersistenceContext EntityManager em;

    private User hod;
    private User examiner;
    private Student student;

    @BeforeEach
    void setUp() {
        hod = userRepository.save(User.builder()
                .email("hod-it@test.rw")
                .fullName("Test HOD")
                .passwordHash("not-a-real-hash")
                .role(Role.HOD)
                .enabled(true)
                .build());

        User studentUser = userRepository.save(User.builder()
                .email("student-it@test.rw")
                .fullName("Test Student")
                .passwordHash("not-a-real-hash")
                .role(Role.STUDENT)
                .enabled(true)
                .build());

        student = studentRepository.save(Student.builder()
                .user(studentUser)
                .regNumber("2024-IT-999")
                .state(StudentState.REGISTERED)
                .build());

        examiner = userRepository.save(User.builder()
                .email("examiner-it@test.rw")
                .fullName("Test Examiner")
                .passwordHash("not-a-real-hash")
                .role(Role.EXAMINER)
                .enabled(true)
                .eligibleExaminer(true)
                .build());
    }

    @Test
    void fullHappyPath_registeredToCompleted_persistsAllStateChanges() {
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
            student = stateService.transition(student, next, hod, null);
        }

        em.flush();
        em.clear();

        assertThat(studentRepository.findById(student.getId()).orElseThrow().getState())
                .isEqualTo(StudentState.COMPLETED);

        long transitionCount = transitionRepository.findAll().stream()
                .filter(t -> t.getStudent().getId().equals(student.getId()))
                .count();
        assertThat(transitionCount).isEqualTo(11);
    }

    @Test
    void invalidTransition_throwsAndDoesNotPersistStateChange() {
        assertThatThrownBy(() -> stateService.transition(student, StudentState.DEFENSE, hod, null))
                .isInstanceOf(InvalidStateTransitionException.class)
                .hasMessageContaining("REGISTERED")
                .hasMessageContaining("DEFENSE");

        em.flush();
        em.clear();

        assertThat(studentRepository.findById(student.getId()).orElseThrow().getState())
                .isEqualTo(StudentState.REGISTERED);
    }

    @Test
    void withdrawal_persistsAndBlocksFurtherTransitions() {
        student = stateService.transition(student, StudentState.CASE_LETTER_SUBMITTED, hod, null);
        student = stateService.transition(student, StudentState.WITHDRAWN, hod, "Dropped out");

        em.flush();
        em.clear();

        Student saved = studentRepository.findById(student.getId()).orElseThrow();
        assertThat(saved.getState()).isEqualTo(StudentState.WITHDRAWN);

        assertThatThrownBy(() ->
                stateService.transition(saved, StudentState.CASE_LETTER_APPROVED, hod, null))
                .isInstanceOf(InvalidStateTransitionException.class);
    }

    @Test
    void proposalLifecycle_threeRejectionsLockThenUnlockAndAccept() {
        walkTo(StudentState.PROTOTYPE_GRANTED);

        // Attempt 1 — rejected
        proposalService.submit(student.getId(), hod);
        proposalService.review(student.getId(), ProposalStatus.REJECTED, "Needs more research", hod);

        // Attempt 2 — rejected
        proposalService.submit(student.getId(), hod);
        proposalService.review(student.getId(), ProposalStatus.REJECTED, "Still insufficient", hod);

        // Attempt 3 — rejected → locks submission
        proposalService.submit(student.getId(), hod);
        proposalService.review(student.getId(), ProposalStatus.REJECTED, "Final rejection", hod);

        em.flush();
        em.clear();

        assertThat(studentRepository.findById(student.getId()).orElseThrow().isProposalLocked()).isTrue();

        // HOD unlocks
        proposalService.unlock(student.getId(), hod);

        em.flush();
        em.clear();

        assertThat(studentRepository.findById(student.getId()).orElseThrow().isProposalLocked()).isFalse();

        // Attempt 4 — accepted
        proposalService.submit(student.getId(), hod);
        proposalService.review(student.getId(), ProposalStatus.ACCEPTED, null, hod);

        em.flush();
        em.clear();

        assertThat(studentRepository.findById(student.getId()).orElseThrow().getState())
                .isEqualTo(StudentState.PROPOSAL_ACCEPTED);
        assertThat(proposalAttemptRepository.findByStudentIdOrderByAttemptNumberAsc(student.getId()))
                .hasSize(4);
    }

    @Test
    void proposalSubmit_whenLocked_throws() {
        walkTo(StudentState.PROTOTYPE_GRANTED);

        proposalService.submit(student.getId(), hod);
        proposalService.review(student.getId(), ProposalStatus.REJECTED, "Bad", hod);
        proposalService.submit(student.getId(), hod);
        proposalService.review(student.getId(), ProposalStatus.REJECTED, "Still bad", hod);
        proposalService.submit(student.getId(), hod);
        proposalService.review(student.getId(), ProposalStatus.REJECTED, "Final", hod);

        em.flush();
        em.clear();

        assertThatThrownBy(() -> proposalService.submit(student.getId(), hod))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("locked");
    }

    @Test
    void panelOutcome_cleared_autoTransitionsToDEFENSE() {
        walkTo(StudentState.PRE_DEFENSE);
        em.flush();
        em.clear();

        student = studentRepository.findById(student.getId()).orElseThrow();

        PanelAssignment panel = panelService.assign(
                student.getId(), examiner.getId(), PanelType.PRE_DEFENSE, null, hod);

        panelService.recordOutcome(panel.getId(), PanelOutcome.CLEARED, "All cleared", hod);

        em.flush();
        em.clear();

        assertThat(studentRepository.findById(student.getId()).orElseThrow().getState())
                .isEqualTo(StudentState.DEFENSE);
    }

    @Test
    void panelOutcome_passed_autoTransitionsToCOMPLETED() {
        walkTo(StudentState.DEFENSE);
        em.flush();
        em.clear();

        student = studentRepository.findById(student.getId()).orElseThrow();

        PanelAssignment panel = panelService.assign(
                student.getId(), examiner.getId(), PanelType.DEFENSE, null, hod);

        panelService.recordOutcome(panel.getId(), PanelOutcome.PASSED, "Excellent work", hod);

        em.flush();
        em.clear();

        assertThat(studentRepository.findById(student.getId()).orElseThrow().getState())
                .isEqualTo(StudentState.COMPLETED);
    }

    private void walkTo(StudentState target) {
        StudentState[] fullChain = {
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
        };
        for (StudentState s : fullChain) {
            student = stateService.transition(student, s, hod, null);
            if (s == target) break;
        }
    }
}
