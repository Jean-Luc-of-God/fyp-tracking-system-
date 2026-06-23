package rw.aauca.fyp.entity;

import jakarta.persistence.*;
import lombok.*;
import rw.aauca.fyp.enums.PanelOutcome;
import rw.aauca.fyp.enums.PanelType;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "panel_assignments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PanelAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "examiner_id", nullable = false)
    private User examiner;

    @Enumerated(EnumType.STRING)
    @Column(name = "panel_type", nullable = false)
    private PanelType panelType;

    @Column(name = "scheduled_at")
    private Instant scheduledAt;

    @Enumerated(EnumType.STRING)
    private PanelOutcome outcome;

    @Column(name = "outcome_note")
    private String outcomeNote;

    @Column(name = "outcome_recorded_at")
    private Instant outcomeRecordedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by", nullable = false)
    private User assignedBy;

    @Column(name = "assigned_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant assignedAt = Instant.now();
}
