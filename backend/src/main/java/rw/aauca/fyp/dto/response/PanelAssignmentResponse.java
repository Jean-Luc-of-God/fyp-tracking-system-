package rw.aauca.fyp.dto.response;

import lombok.Builder;
import lombok.Data;
import rw.aauca.fyp.entity.PanelAssignment;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class PanelAssignmentResponse {
    private UUID id;
    private UUID studentId;
    private String studentName;
    private String studentRegNumber;
    private UUID examinerId;
    private String examinerName;
    private String panelType;
    private Instant scheduledAt;
    private int attemptNumber;
    private String outcome;
    private String outcomeNote;
    private Instant outcomeRecordedAt;
    private UUID assignedById;
    private String assignedByName;
    private Instant assignedAt;

    public static PanelAssignmentResponse from(PanelAssignment a) {
        return PanelAssignmentResponse.builder()
                .id(a.getId())
                .studentId(a.getStudent().getId())
                .studentName(a.getStudent().getUser().getFullName())
                .studentRegNumber(a.getStudent().getRegNumber())
                .examinerId(a.getExaminer().getId())
                .examinerName(a.getExaminer().getFullName())
                .panelType(a.getPanelType().name())
                .scheduledAt(a.getScheduledAt())
                .attemptNumber(a.getAttemptNumber())
                .outcome(a.getOutcome() != null ? a.getOutcome().name() : null)
                .outcomeNote(a.getOutcomeNote())
                .outcomeRecordedAt(a.getOutcomeRecordedAt())
                .assignedById(a.getAssignedBy().getId())
                .assignedByName(a.getAssignedBy().getFullName())
                .assignedAt(a.getAssignedAt())
                .build();
    }
}
