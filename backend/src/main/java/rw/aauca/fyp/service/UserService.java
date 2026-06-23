package rw.aauca.fyp.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import rw.aauca.fyp.dto.request.CreateUserRequest;
import rw.aauca.fyp.entity.User;
import rw.aauca.fyp.enums.Role;
import rw.aauca.fyp.repository.UserRepository;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public List<User> getAll() { return userRepository.findAll(); }

    public List<User> getByRole(Role role) { return userRepository.findByRole(role); }

    public List<User> getEligibleExaminers() { return userRepository.findByEligibleExaminerTrue(); }

    public User create(CreateUserRequest req, User actor) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new RuntimeException("Email already in use: " + req.getEmail());
        }
        String rawPassword = req.getPassword() != null ? req.getPassword() : "ChangeMe@1234";
        User user = User.builder()
                .email(req.getEmail())
                .fullName(req.getFullName())
                .phone(req.getPhone())
                .role(req.getRole())
                .passwordHash(passwordEncoder.encode(rawPassword))
                .eligibleExaminer(req.isEligibleExaminer())
                .enabled(true)
                .build();
        userRepository.save(user);
        auditService.log(actor, "CREATE_USER", "User", user.getId(),
                "Created " + user.getRole() + " account for " + user.getEmail(), null);
        return user;
    }

    public User setEnabled(UUID userId, boolean enabled, User actor) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        user.setEnabled(enabled);
        userRepository.save(user);
        auditService.log(actor, enabled ? "ENABLE_USER" : "DISABLE_USER", "User", userId,
                user.getEmail(), null);
        return user;
    }

    public User resetPassword(UUID userId, String newPassword, User actor) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        auditService.log(actor, "RESET_PASSWORD", "User", userId, user.getEmail(), null);
        return user;
    }

    public void changePassword(UUID userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        auditService.log(user, "CHANGE_PASSWORD", "User", userId, user.getEmail(), null);
    }
}
