package rw.aauca.fyp.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "meetings")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Meeting {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supervisor_id", nullable = false)
    private User supervisor;

    @Column(name = "scheduled_at", nullable = false)
    private Instant scheduledAt;

    @Column(nullable = false)
    private boolean confirmed = false;

    @Column(name = "confirmed_at")
    private Instant confirmedAt;

    private Boolean attended;

    private String topic;

    private String notes;

    @Column(name = "meeting_type", nullable = false)
    private String meetingType = "IN_PERSON";

    private String location;

    @Column(name = "meet_link")
    private String meetLink;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
