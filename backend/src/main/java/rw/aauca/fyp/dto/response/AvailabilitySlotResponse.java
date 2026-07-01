package rw.aauca.fyp.dto.response;

import lombok.Builder;
import lombok.Data;
import rw.aauca.fyp.entity.AvailabilitySlot;

import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Data
@Builder
public class AvailabilitySlotResponse {
    private static final DateTimeFormatter HHMM = DateTimeFormatter.ofPattern("HH:mm");

    private UUID id;
    private UUID supervisorId;
    private String dayOfWeek;
    private String startTime;
    private String endTime;
    private String location;
    private boolean active;

    public static AvailabilitySlotResponse from(AvailabilitySlot s) {
        return AvailabilitySlotResponse.builder()
                .id(s.getId())
                .supervisorId(s.getSupervisor().getId())
                .dayOfWeek(s.getDayOfWeek())
                .startTime(s.getStartTime().format(HHMM))
                .endTime(s.getEndTime().format(HHMM))
                .location(s.getLocation())
                .active(s.isActive())
                .build();
    }
}
