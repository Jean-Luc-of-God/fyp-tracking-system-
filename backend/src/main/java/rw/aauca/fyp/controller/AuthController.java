package rw.aauca.fyp.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import rw.aauca.fyp.dto.request.LoginRequest;
import rw.aauca.fyp.entity.User;
import rw.aauca.fyp.service.AuthService;
import rw.aauca.fyp.service.JwtBlacklistService;
import rw.aauca.fyp.security.JwtUtil;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtBlacklistService blacklistService;
    private final JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request, HttpServletRequest http) {
        return ResponseEntity.ok(authService.login(request, http.getRemoteAddr()));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request,
                                    @AuthenticationPrincipal User currentUser) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            try {
                String jti = jwtUtil.extractJti(token);
                blacklistService.blacklist(jti, jwtUtil.extractExpiration(token));
            } catch (Exception ignored) { /* malformed token — nothing to blacklist */ }
        }
        return ResponseEntity.noContent().build();
    }
}
