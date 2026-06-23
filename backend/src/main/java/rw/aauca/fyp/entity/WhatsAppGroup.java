package rw.aauca.fyp.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "whatsapp_groups")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WhatsAppGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supervisor_id", nullable = false)
    private User supervisor;

    @Column(name = "team_name", nullable = false)
    private String teamName;

    @Column(nullable = false)
    private String link;

    @Column(name = "is_predefense", nullable = false)
    private boolean predefense = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
