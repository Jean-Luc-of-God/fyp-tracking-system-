package rw.aauca.fyp.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import rw.aauca.fyp.enums.Role;

@Data
public class CreateUserRequest {
    @Email @NotBlank
    private String email;
    @NotBlank
    private String fullName;
    private String phone;
    @NotNull
    private Role role;
    private String password;
    private boolean eligibleExaminer;
}
