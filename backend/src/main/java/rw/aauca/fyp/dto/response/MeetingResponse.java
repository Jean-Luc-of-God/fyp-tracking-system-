package rw.aauca.fyp.dto.response;

import lombok.Builder;
import lombok.Data;
import rw.aauca.fyp.entity.Meeting;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class MeetingResponse {
    private UUID id;
    private UUID studentId;
    private UUID supervisorId;
    private Instant scheduledAt;
    private boolean confirmed;
    private Instant confirmedAt;
    private Boolean attended;
    private String topic;
    private String notes;
    private String meetingType;
    private String location;
    private String meetLink;

    public static MeetingResponse from(Meeting m) {
        return MeetingResponse.builder()
                .id(m.getId())
                .studentId(m.getStudent().getId())
                .supervisorId(m.getSupervisor().getId())
                .scheduledAt(m.getScheduledAt())
                .confirmed(m.isConfirmed())
                .confirmedAt(m.getConfirmedAt())
                .attended(m.getAttended())
                .topic(m.getTopic())
                .notes(m.getNotes())
                .meetingType(m.getMeetingType())
                .location(m.getLocation())
                .meetLink(m.getMeetLink())
                .build();
    }
}
