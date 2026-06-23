package rw.aauca.fyp.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
public class ScheduleMeetingRequest {
    @NotNull
    private UUID studentId;

    @NotNull
    private Instant scheduledAt;

    private String topic;
    private String meetingType = "IN_PERSON";
    private String location;
    private String meetLink;
}
