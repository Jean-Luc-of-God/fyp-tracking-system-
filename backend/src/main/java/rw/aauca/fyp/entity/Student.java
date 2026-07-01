package rw.aauca.fyp.entity;

import jakarta.persistence.*;
import lombok.*;
import rw.aauca.fyp.enums.StudentState;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "students")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "reg_number", nullable = false, unique = true)
    private String regNumber;

    private String organisation;

    @Column(name = "project_topic")
    private String projectTopic;

    @Column(name = "group_label")
    private String groupLabel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StudentState state = StudentState.REGISTERED;

    @Column(name = "state_entered_at", nullable = false)
    @Builder.Default
    private Instant stateEnteredAt = Instant.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supervisor_id")
    private User supervisor;

    @Column(name = "supervisor_assigned_at")
    private Instant supervisorAssignedAt;

    @Column(name = "book_signed_off", nullable = false)
    private boolean bookSignedOff = false;

    @Column(name = "proto_attempts", nullable = false)
    private int protoAttempts = 0;

    @Column(name = "proposal_locked", nullable = false)
    private boolean proposalLocked = false;

    @Column(nullable = false)
    private boolean flagged = false;

    private String note;

    @Column(name = "letter_rejection_reason")
    private String letterRejectionReason;

    @Column(name = "letter_file_name")
    private String letterFileName;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @PreUpdate
    void onUpdate() { this.updatedAt = Instant.now(); }
}
