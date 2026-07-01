package rw.aauca.fyp.dto.request;

import lombok.Data;

import java.time.Instant;

@Data
public class UpdatePanelScheduleRequest {
    private Instant scheduledAt;
}
