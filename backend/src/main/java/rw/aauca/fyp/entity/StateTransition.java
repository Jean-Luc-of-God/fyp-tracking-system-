package rw.aauca.fyp.entity;

import jakarta.persistence.*;
import lombok.*;
import rw.aauca.fyp.enums.StudentState;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "state_transitions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StateTransition {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_state")
    private StudentState fromState;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_state", nullable = false)
    private StudentState toState;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id", nullable = false)
    private User actor;

    @Column(name = "actor_role", nullable = false)
    private String actorRole;

    private String note;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
