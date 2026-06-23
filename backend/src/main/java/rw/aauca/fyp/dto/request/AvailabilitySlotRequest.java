package rw.aauca.fyp.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalTime;

@Data
public class AvailabilitySlotRequest {
    @NotBlank
    private String dayOfWeek;   // e.g. MONDAY

    @NotNull
    private LocalTime startTime;

    @NotNull
    private LocalTime endTime;

    private String location;
}
