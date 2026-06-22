package rw.aauca.fyp.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rw.aauca.fyp.entity.NotificationLog;
import rw.aauca.fyp.enums.NotificationStatus;

import java.util.List;
import java.util.UUID;

public interface NotificationLogRepository extends JpaRepository<NotificationLog, UUID> {
    List<NotificationLog> findByRecipientIdOrderByCreatedAtDesc(UUID recipientId);
    List<NotificationLog> findByStatus(NotificationStatus status);
    List<NotificationLog> findByStudentIdOrderByCreatedAtDesc(UUID studentId);
}
