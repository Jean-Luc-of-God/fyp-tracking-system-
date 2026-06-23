package rw.aauca.fyp.dto.request;

import lombok.Data;
import rw.aauca.fyp.enums.PanelType;

import java.time.Instant;
import java.util.UUID;

@Data
public class AssignPanelRequest {
    private UUID studentId;
    private UUID examinerId;
    private PanelType panelType;
    private Instant scheduledAt;
}
