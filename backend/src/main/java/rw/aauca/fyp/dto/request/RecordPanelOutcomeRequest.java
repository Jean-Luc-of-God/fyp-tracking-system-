package rw.aauca.fyp.dto.request;

import lombok.Data;
import rw.aauca.fyp.enums.PanelOutcome;

@Data
public class RecordPanelOutcomeRequest {
    private PanelOutcome outcome;
    private String outcomeNote;
}
