package rw.aauca.fyp.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import rw.aauca.fyp.dto.response.NotificationLogResponse;
import rw.aauca.fyp.entity.Student;
import rw.aauca.fyp.entity.User;
import rw.aauca.fyp.enums.NotificationStatus;
import rw.aauca.fyp.enums.Role;
import rw.aauca.fyp.repository.NotificationLogRepository;
import rw.aauca.fyp.repository.StudentRepository;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationLogRepository notificationLogRepository;
    private final StudentRepository studentRepository;

    /** My own notification history (any authenticated user) */
    @GetMapping("/me")
    public ResponseEntity<List<NotificationLogResponse>> getMyNotifications(
            @AuthenticationPrincipal User currentUser) {

        List<NotificationLogResponse> result = notificationLogRepository
                .findByRecipientIdOrderByCreatedAtDesc(currentUser.getId())
                .stream().map(NotificationLogResponse::from).toList();
        return ResponseEntity.ok(result);
    }

    /** All notifications sent in relation to a specific student */
    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole('SUPERADMIN','HOD','FACILITATOR','SUPERVISOR')")
    public ResponseEntity<List<NotificationLogResponse>> getByStudent(@PathVariable UUID studentId,
                                                                       @AuthenticationPrincipal User actor) {
        if (actor.getRole() == Role.SUPERVISOR) {
            Student student = studentRepository.findById(studentId)
                    .orElseThrow(() -> new IllegalArgumentException("Student not found"));
            if (student.getSupervisor() == null || !student.getSupervisor().getId().equals(actor.getId())) {
                throw new AccessDeniedException("You are not the assigned supervisor for this student");
            }
        }
        List<NotificationLogResponse> result = notificationLogRepository
                .findByStudentIdOrderByCreatedAtDesc(studentId)
                .stream().map(NotificationLogResponse::from).toList();
        return ResponseEntity.ok(result);
    }

    /** All failed notifications — for admin visibility and manual retry decisions */
    @GetMapping("/failed")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<List<NotificationLogResponse>> getFailed() {
        List<NotificationLogResponse> result = notificationLogRepository
                .findByStatus(NotificationStatus.FAILED)
                .stream().map(NotificationLogResponse::from).toList();
        return ResponseEntity.ok(result);
    }

    /** All notifications for a specific recipient */
    @GetMapping("/recipient/{recipientId}")
    @PreAuthorize("hasAnyRole('SUPERADMIN','HOD')")
    public ResponseEntity<List<NotificationLogResponse>> getByRecipient(@PathVariable UUID recipientId) {
        List<NotificationLogResponse> result = notificationLogRepository
                .findByRecipientIdOrderByCreatedAtDesc(recipientId)
                .stream().map(NotificationLogResponse::from).toList();
        return ResponseEntity.ok(result);
    }
}
