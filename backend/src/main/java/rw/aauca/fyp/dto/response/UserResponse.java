package rw.aauca.fyp.dto.response;

import lombok.Builder;
import lombok.Data;
import rw.aauca.fyp.entity.User;

import java.util.UUID;

@Data
@Builder
public class UserResponse {
    private UUID id;
    private String fullName;
    private String email;
    private String phone;
    private String role;
    private boolean enabled;
    private boolean eligibleExaminer;

    public static UserResponse from(User u) {
        return UserResponse.builder()
                .id(u.getId())
                .fullName(u.getFullName())
                .email(u.getEmail())
                .phone(u.getPhone())
                .role(u.getRole().name())
                .enabled(u.isEnabled())
                .eligibleExaminer(u.isEligibleExaminer())
                .build();
    }
}
