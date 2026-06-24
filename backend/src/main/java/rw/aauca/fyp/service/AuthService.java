package rw.aauca.fyp.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;
import rw.aauca.fyp.dto.request.LoginRequest;
import rw.aauca.fyp.dto.response.AuthResponse;
import rw.aauca.fyp.entity.User;
import rw.aauca.fyp.repository.UserRepository;
import rw.aauca.fyp.security.JwtUtil;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final AuditService auditService;

    public AuthResponse login(LoginRequest request, String ip) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        } catch (BadCredentialsException e) {
            auditService.log(null, "LOGIN_FAILED", "User", null,
                    "Bad credentials for: " + request.getEmail() + " from " + ip, ip);
            throw e;
        } catch (DisabledException e) {
            auditService.log(null, "LOGIN_FAILED", "User", null,
                    "Disabled account login attempt: " + request.getEmail() + " from " + ip, ip);
            throw e;
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String token = jwtUtil.generate(user);
        auditService.log(user, "LOGIN", "User", user.getId(),
                "Successful login from " + ip, ip);

        return new AuthResponse(token, user.getId(), user.getEmail(), user.getFullName(), user.getRole().name());
    }
}
