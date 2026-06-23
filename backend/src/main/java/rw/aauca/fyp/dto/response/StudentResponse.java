package rw.aauca.fyp.dto.response;

import lombok.Builder;
import lombok.Data;
import rw.aauca.fyp.entity.Student;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class StudentResponse {
    private UUID id;
    private UUID userId;
    private String regNumber;
    private String fullName;
    private String email;
    private String phone;
    private String organisation;
    private String projectTopic;
    private String groupLabel;
    private String state;
    private Instant stateEnteredAt;
    private UUID supervisorId;
    private String supervisorName;
    private boolean bookSignedOff;
    private int protoAttempts;
    private boolean proposalLocked;
    private boolean flagged;
    private String note;

    public static StudentResponse from(Student s) {
        return StudentResponse.builder()
                .id(s.getId())
                .userId(s.getUser().getId())
                .regNumber(s.getRegNumber())
                .fullName(s.getUser().getFullName())
                .email(s.getUser().getEmail())
                .phone(s.getUser().getPhone())
                .organisation(s.getOrganisation())
                .projectTopic(s.getProjectTopic())
                .groupLabel(s.getGroupLabel())
                .state(s.getState().name())
                .stateEnteredAt(s.getStateEnteredAt())
                .supervisorId(s.getSupervisor() != null ? s.getSupervisor().getId() : null)
                .supervisorName(s.getSupervisor() != null ? s.getSupervisor().getFullName() : null)
                .bookSignedOff(s.isBookSignedOff())
                .protoAttempts(s.getProtoAttempts())
                .proposalLocked(s.isProposalLocked())
                .flagged(s.isFlagged())
                .note(s.getNote())
                .build();
    }
}
