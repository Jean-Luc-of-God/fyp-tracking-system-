package rw.aauca.fyp.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import rw.aauca.fyp.dto.request.AvailabilitySlotRequest;
import rw.aauca.fyp.dto.request.MeetingOutcomeRequest;
import rw.aauca.fyp.dto.request.ScheduleMeetingRequest;
import rw.aauca.fyp.entity.User;
import rw.aauca.fyp.service.SupervisionService;

import java.util.UUID;

@RestController
@RequestMapping("/api/supervision")
@RequiredArgsConstructor
public class SupervisionController {

    private final SupervisionService supervisionService;

    // ── Availability slots ────────────────────────────────────────────────

    @PostMapping("/slots")
    @PreAuthorize("hasRole('SUPERVISOR')")
    public ResponseEntity<?> addSlot(@Valid @RequestBody AvailabilitySlotRequest req,
                                     @AuthenticationPrincipal User actor) {
        return ResponseEntity.ok(supervisionService.addSlot(req, actor));
    }

    @GetMapping("/slots/me")
    @PreAuthorize("hasRole('SUPERVISOR')")
    public ResponseEntity<?> mySlots(@AuthenticationPrincipal User actor) {
        return ResponseEntity.ok(supervisionService.getMySlots(actor));
    }

    @GetMapping("/slots/{supervisorId}")
    @PreAuthorize("hasAnyRole('HOD','FACILITATOR','SUPERADMIN','STUDENT')")
    public ResponseEntity<?> slotsBySupervisor(@PathVariable UUID supervisorId) {
        return ResponseEntity.ok(supervisionService.getSlotsForSupervisor(supervisorId));
    }

    @DeleteMapping("/slots/{slotId}")
    @PreAuthorize("hasRole('SUPERVISOR')")
    public ResponseEntity<?> deleteSlot(@PathVariable UUID slotId,
                                        @AuthenticationPrincipal User actor) {
        supervisionService.deleteSlot(slotId, actor);
        return ResponseEntity.noContent().build();
    }

    // ── Meetings ──────────────────────────────────────────────────────────

    @PostMapping("/meetings")
    @PreAuthorize("hasRole('SUPERVISOR')")
    public ResponseEntity<?> scheduleMeeting(@Valid @RequestBody ScheduleMeetingRequest req,
                                             @AuthenticationPrincipal User actor) {
        return ResponseEntity.ok(supervisionService.scheduleMeeting(req, actor));
    }

    @PatchMapping("/meetings/{meetingId}/confirm")
    @PreAuthorize("hasRole('SUPERVISOR')")
    public ResponseEntity<?> confirmMeeting(@PathVariable UUID meetingId,
                                            @AuthenticationPrincipal User actor) {
        return ResponseEntity.ok(supervisionService.confirmMeeting(meetingId, actor));
    }

    @PatchMapping("/meetings/{meetingId}/outcome")
    @PreAuthorize("hasRole('SUPERVISOR')")
    public ResponseEntity<?> recordOutcome(@PathVariable UUID meetingId,
                                           @Valid @RequestBody MeetingOutcomeRequest req,
                                           @AuthenticationPrincipal User actor) {
        return ResponseEntity.ok(supervisionService.recordOutcome(meetingId, req, actor));
    }

    @GetMapping("/meetings/me")
    @PreAuthorize("hasRole('SUPERVISOR')")
    public ResponseEntity<?> myMeetings(@AuthenticationPrincipal User actor) {
        return ResponseEntity.ok(supervisionService.getMeetingsForSupervisor(actor));
    }

    @GetMapping("/meetings/student/{studentId}")
    @PreAuthorize("hasAnyRole('SUPERVISOR','HOD','FACILITATOR','SUPERADMIN')")
    public ResponseEntity<?> meetingsForStudent(@PathVariable UUID studentId,
                                                @AuthenticationPrincipal User actor) {
        return ResponseEntity.ok(supervisionService.getMeetingsForStudent(studentId, actor));
    }
}
