package rw.aauca.fyp.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MeetingOutcomeRequest {
    @NotNull
    private Boolean attended;
    private String notes;
}
