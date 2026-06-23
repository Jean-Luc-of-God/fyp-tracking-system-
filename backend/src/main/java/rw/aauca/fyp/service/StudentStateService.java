package rw.aauca.fyp.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rw.aauca.fyp.entity.StateTransition;
import rw.aauca.fyp.entity.Student;
import rw.aauca.fyp.entity.User;
import rw.aauca.fyp.enums.StudentState;
import rw.aauca.fyp.exception.InvalidStateTransitionException;
import rw.aauca.fyp.repository.StateTransitionRepository;
import rw.aauca.fyp.repository.StudentRepository;

import java.time.Instant;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class StudentStateService {

    private final StudentRepository studentRepository;
    private final StateTransitionRepository transitionRepository;
    private final AuditService auditService;
    private final EmailService emailService;

    // Allowed transitions: from -> set of valid next states
    private static final Map<StudentState, Set<StudentState>> ALLOWED = Map.ofEntries(
        Map.entry(StudentState.REGISTERED,               EnumSet.of(StudentState.CASE_LETTER_SUBMITTED)),
        Map.entry(StudentState.CASE_LETTER_SUBMITTED,    EnumSet.of(StudentState.CASE_LETTER_APPROVED)),
        Map.entry(StudentState.CASE_LETTER_APPROVED,     EnumSet.of(StudentState.PROTOTYPE_REVIEW)),
        Map.entry(StudentState.PROTOTYPE_REVIEW,         EnumSet.of(StudentState.PROTOTYPE_REVIEW, StudentState.PROTOTYPE_GRANTED)),
        Map.entry(StudentState.PROTOTYPE_GRANTED,        EnumSet.of(StudentState.PROPOSAL_UNDER_REVIEW)),
        Map.entry(StudentState.PROPOSAL_UNDER_REVIEW,    EnumSet.of(StudentState.PROPOSAL_UNDER_REVIEW, StudentState.PROPOSAL_ACCEPTED)),
        Map.entry(StudentState.PROPOSAL_ACCEPTED,        EnumSet.of(StudentState.SUPERVISION)),
        Map.entry(StudentState.SUPERVISION,              EnumSet.of(StudentState.BOOK_SUBMITTED)),
        Map.entry(StudentState.BOOK_SUBMITTED,           EnumSet.of(StudentState.PRE_DEFENSE)),
        Map.entry(StudentState.PRE_DEFENSE,              EnumSet.of(StudentState.DEFENSE)),
        Map.entry(StudentState.DEFENSE,                  EnumSet.of(StudentState.COMPLETED))
    );

    private static final Set<StudentState> TERMINAL = EnumSet.of(StudentState.COMPLETED, StudentState.WITHDRAWN);

    @Transactional
    public Student transition(Student student, StudentState toState, User actor, String note) {
        StudentState fromState = student.getState();

        // WITHDRAWN is allowed from any non-terminal state
        boolean toWithdrawn = toState == StudentState.WITHDRAWN;
        if (!toWithdrawn) {
            Set<StudentState> allowed = ALLOWED.getOrDefault(fromState, EnumSet.noneOf(StudentState.class));
            if (!allowed.contains(toState)) {
                throw new InvalidStateTransitionException(fromState, toState);
            }
        } else if (TERMINAL.contains(fromState)) {
            throw new InvalidStateTransitionException(fromState, toState);
        }

        // Track re-presentations in PROTOTYPE_REVIEW
        if (fromState == StudentState.PROTOTYPE_REVIEW && toState == StudentState.PROTOTYPE_REVIEW) {
            student.setProtoAttempts(student.getProtoAttempts() + 1);
        }

        student.setState(toState);
        student.setStateEnteredAt(Instant.now());
        studentRepository.save(student);

        transitionRepository.save(StateTransition.builder()
                .student(student)
                .fromState(fromState)
                .toState(toState)
                .actor(actor)
                .actorRole(actor.getRole().name())
                .note(note)
                .build());

        auditService.log(actor, "STATE_TRANSITION", "Student", student.getId(),
                fromState + " -> " + toState, null);

        // Notify the student of their new state (skip self-loop in PROTOTYPE_REVIEW)
        if (student.getUser() != null && fromState != toState) {
            emailService.notifyStateTransition(student.getUser(), student, toState.name(), note);
        }

        return student;
    }
}
