package rw.aauca.fyp.dto.response;

import rw.aauca.fyp.entity.AuditLog;

import java.time.Instant;
import java.util.UUID;

public record AuditLogResponse(
        UUID id,
        String actorEmail,
        String actorRole,
        String action,
        String entityType,
        UUID entityId,
        String detail,
        String ipAddress,
        Instant createdAt
) {
    public static AuditLogResponse from(AuditLog log) {
        return new AuditLogResponse(
                log.getId(),
                log.getActorEmail(),
                log.getActorRole(),
                log.getAction(),
                log.getEntityType(),
                log.getEntityId(),
                log.getDetail(),
                log.getIpAddress(),
                log.getCreatedAt()
        );
    }
}
