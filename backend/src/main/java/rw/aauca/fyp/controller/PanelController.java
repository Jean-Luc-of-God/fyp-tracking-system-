package rw.aauca.fyp.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import rw.aauca.fyp.dto.request.AssignPanelRequest;
import rw.aauca.fyp.dto.request.RecordPanelOutcomeRequest;
import rw.aauca.fyp.dto.request.UpdatePanelScheduleRequest;
import rw.aauca.fyp.dto.response.PanelAssignmentResponse;
import rw.aauca.fyp.entity.User;
import rw.aauca.fyp.service.PanelService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/panels")
@RequiredArgsConstructor
public class PanelController {

    private final PanelService panelService;

    @PostMapping("/assign")
    @PreAuthorize("hasAnyRole('HOD','FACILITATOR','SUPERADMIN')")
    public ResponseEntity<PanelAssignmentResponse> assign(@RequestBody AssignPanelRequest request,
                                                          @AuthenticationPrincipal User actor) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                PanelAssignmentResponse.from(
                        panelService.assign(request.getStudentId(), request.getExaminerId(),
                                request.getPanelType(), request.getScheduledAt(), actor)));
    }

    @PatchMapping("/{id}/schedule")
    @PreAuthorize("hasAnyRole('EXAMINER','HOD','SUPERVISOR','FACILITATOR','SUPERADMIN')")
    public ResponseEntity<PanelAssignmentResponse> updateSchedule(@PathVariable UUID id,
                                                                   @RequestBody UpdatePanelScheduleRequest request,
                                                                   @AuthenticationPrincipal User actor) {
        return ResponseEntity.ok(PanelAssignmentResponse.from(
                panelService.updateSchedule(id, request.getScheduledAt(), actor)));
    }

    @PatchMapping("/{id}/outcome")
    @PreAuthorize("hasAnyRole('EXAMINER','HOD','SUPERVISOR','FACILITATOR','SUPERADMIN')")
    public ResponseEntity<PanelAssignmentResponse> recordOutcome(@PathVariable UUID id,
                                                                  @RequestBody RecordPanelOutcomeRequest request,
                                                                  @AuthenticationPrincipal User actor) {
        return ResponseEntity.ok(PanelAssignmentResponse.from(
                panelService.recordOutcome(id, request.getOutcome(), request.getOutcomeNote(), actor)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('HOD','FACILITATOR','SUPERADMIN')")
    public ResponseEntity<Void> remove(@PathVariable UUID id,
                                       @AuthenticationPrincipal User actor) {
        panelService.removeAssignment(id, actor);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole('STUDENT','SUPERVISOR','HOD','FACILITATOR','SUPERADMIN','EXAMINER')")
    public ResponseEntity<List<PanelAssignmentResponse>> getByStudent(@PathVariable UUID studentId,
                                                                       @AuthenticationPrincipal User actor) {
        if (actor.getRole() == rw.aauca.fyp.enums.Role.STUDENT) {
            // Students may only view their own panel assignments
            panelService.assertStudentOwnership(studentId, actor);
        }
        return ResponseEntity.ok(panelService.getByStudent(studentId)
                .stream().map(PanelAssignmentResponse::from).toList());
    }

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('EXAMINER','HOD','SUPERVISOR','FACILITATOR','SUPERADMIN')")
    public ResponseEntity<List<PanelAssignmentResponse>> getMyAssignments(@AuthenticationPrincipal User actor) {
        return ResponseEntity.ok(panelService.getMyAssignments(actor.getId())
                .stream().map(PanelAssignmentResponse::from).toList());
    }
}
