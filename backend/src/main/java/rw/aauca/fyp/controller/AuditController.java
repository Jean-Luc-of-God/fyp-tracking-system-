package rw.aauca.fyp.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import rw.aauca.fyp.dto.response.AuditLogResponse;
import rw.aauca.fyp.repository.AuditLogRepository;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
public class AuditController {

    private final AuditLogRepository auditLogRepository;

    /** Paginated full audit log — SUPERADMIN only */
    @GetMapping
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<Page<AuditLogResponse>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        Page<AuditLogResponse> result = auditLogRepository
                .findAllByOrderByCreatedAtDesc(PageRequest.of(page, size))
                .map(AuditLogResponse::from);
        return ResponseEntity.ok(result);
    }

    /** All actions performed by a specific actor */
    @GetMapping("/actor/{actorId}")
    @PreAuthorize("hasAnyRole('SUPERADMIN','HOD')")
    public ResponseEntity<List<AuditLogResponse>> getByActor(@PathVariable UUID actorId) {
        List<AuditLogResponse> result = auditLogRepository
                .findByActorIdOrderByCreatedAtDesc(actorId)
                .stream().map(AuditLogResponse::from).toList();
        return ResponseEntity.ok(result);
    }

    /** All audit entries touching a specific entity (e.g. entityType=Student, entityId=<uuid>) */
    @GetMapping("/entity/{entityType}/{entityId}")
    @PreAuthorize("hasAnyRole('SUPERADMIN','HOD','FACILITATOR')")
    public ResponseEntity<List<AuditLogResponse>> getByEntity(
            @PathVariable String entityType,
            @PathVariable UUID entityId) {

        List<AuditLogResponse> result = auditLogRepository
                .findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId)
                .stream().map(AuditLogResponse::from).toList();
        return ResponseEntity.ok(result);
    }

    /** Filter by action name (e.g. STATE_TRANSITION, PROPOSAL_ACCEPTED) */
    @GetMapping("/action/{action}")
    @PreAuthorize("hasAnyRole('SUPERADMIN','HOD','FACILITATOR')")
    public ResponseEntity<List<AuditLogResponse>> getByAction(@PathVariable String action) {
        List<AuditLogResponse> result = auditLogRepository
                .findByActionOrderByCreatedAtDesc(action)
                .stream().map(AuditLogResponse::from).toList();
        return ResponseEntity.ok(result);
    }
}
