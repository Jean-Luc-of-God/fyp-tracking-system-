package rw.aauca.fyp.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import rw.aauca.fyp.dto.request.CreateUserRequest;
import rw.aauca.fyp.dto.response.UserResponse;
import rw.aauca.fyp.entity.User;
import rw.aauca.fyp.enums.Role;
import rw.aauca.fyp.service.UserService;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(userService.getAll().stream().map(UserResponse::from).toList());
    }

    @GetMapping("/role/{role}")
    @PreAuthorize("hasAnyRole('HOD','FACILITATOR','SUPERADMIN')")
    public ResponseEntity<?> getByRole(@PathVariable String role) {
        return ResponseEntity.ok(userService.getByRole(Role.valueOf(role.toUpperCase()))
                .stream().map(UserResponse::from).toList());
    }

    @GetMapping("/examiners")
    @PreAuthorize("hasAnyRole('HOD','FACILITATOR','SUPERADMIN')")
    public ResponseEntity<?> getExaminers() {
        return ResponseEntity.ok(userService.getEligibleExaminers().stream().map(UserResponse::from).toList());
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<?> create(@Valid @RequestBody CreateUserRequest req,
                                    @AuthenticationPrincipal User actor) {
        return ResponseEntity.ok(UserResponse.from(userService.create(req, actor)));
    }

    @PatchMapping("/{id}/enabled")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<?> setEnabled(@PathVariable UUID id,
                                        @RequestBody Map<String, Boolean> body,
                                        @AuthenticationPrincipal User actor) {
        return ResponseEntity.ok(UserResponse.from(userService.setEnabled(id, body.get("enabled"), actor)));
    }

    @PostMapping("/{id}/reset-password")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<?> resetPassword(@PathVariable UUID id,
                                           @RequestBody Map<String, String> body,
                                           @AuthenticationPrincipal User actor) {
        String newPassword = body.get("newPassword");
        if (newPassword == null || newPassword.length() < 10) {
            return ResponseEntity.badRequest().body(Map.of("message", "Password must be at least 10 characters"));
        }
        userService.resetPassword(id, newPassword, actor);
        return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
    }

    @PostMapping("/me/change-password")
    public ResponseEntity<?> changeOwnPassword(@RequestBody Map<String, String> body,
                                               @AuthenticationPrincipal User currentUser) {
        String current  = body.get("currentPassword");
        String newPass  = body.get("newPassword");
        if (current == null || newPass == null || newPass.length() < 10) {
            return ResponseEntity.badRequest().body(Map.of("message", "currentPassword and newPassword (min 10 chars) are required"));
        }
        userService.changePassword(currentUser.getId(), current, newPass);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }
}
