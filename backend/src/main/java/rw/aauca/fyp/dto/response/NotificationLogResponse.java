package rw.aauca.fyp.dto.response;

import rw.aauca.fyp.entity.NotificationLog;
import rw.aauca.fyp.enums.NotificationStatus;

import java.time.Instant;
import java.util.UUID;

public record NotificationLogResponse(
        UUID id,
        String templateKey,
        UUID recipientId,
        String recipientEmail,
        UUID studentId,
        String subject,
        NotificationStatus status,
        String errorMessage,
        int retryCount,
        Instant sentAt,
        Instant createdAt
) {
    public static NotificationLogResponse from(NotificationLog log) {
        return new NotificationLogResponse(
                log.getId(),
                log.getTemplateKey(),
                log.getRecipient().getId(),
                log.getRecipient().getEmail(),
                log.getStudent() != null ? log.getStudent().getId() : null,
                log.getSubject(),
                log.getStatus(),
                log.getErrorMessage(),
                log.getRetryCount(),
                log.getSentAt(),
                log.getCreatedAt()
        );
    }
}
