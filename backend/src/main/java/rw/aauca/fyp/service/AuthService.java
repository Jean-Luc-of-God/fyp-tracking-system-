package rw.aauca.fyp.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
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
    private final OtpService otpService;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

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

    /** Generates an OTP and emails it. Throws if the user doesn't exist or email fails. */
    public void sendPasswordResetOtp(String email) {
        User user = userRepository.findByEmail(email)
                .filter(User::isEnabled)
                .orElseThrow(() -> new RuntimeException("No active account found for that email address."));
        String otp = otpService.generateAndStore(email);
        emailService.sendOtp(email, otp); // throws RuntimeException if mail server fails
        auditService.log(user, "OTP_REQUESTED", "User", user.getId(), "Password reset OTP requested", null);
    }

    /** Validates OTP and sets a new password. Throws RuntimeException on failure. */
    public void resetPasswordWithOtp(String email, String otp, String newPassword) {
        if (newPassword == null || newPassword.length() < 8) {
            throw new RuntimeException("Password must be at least 8 characters.");
        }
        if (!otpService.validate(email, otp)) {
            throw new RuntimeException("Invalid or expired reset code. Please request a new one.");
        }
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No account found for that email."));
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        auditService.log(user, "PASSWORD_RESET", "User", user.getId(),
                "Password reset via OTP", null);
    }
}
