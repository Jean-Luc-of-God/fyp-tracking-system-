package rw.aauca.fyp.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import rw.aauca.fyp.entity.AuditLog;
import rw.aauca.fyp.entity.User;
import rw.aauca.fyp.repository.AuditLogRepository;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public void log(User actor, String action, String entityType, UUID entityId, String detail, String ip) {
        var entry = AuditLog.builder()
                .actor(actor)
                .actorEmail(actor != null ? actor.getEmail() : "system")
                .actorRole(actor != null ? actor.getRole().name() : "SYSTEM")
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .detail(detail)
                .ipAddress(ip)
                .build();
        auditLogRepository.save(entry);
    }

    public void log(User actor, String action, String detail) {
        log(actor, action, null, null, detail, null);
    }
}
