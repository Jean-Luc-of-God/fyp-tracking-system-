package rw.aauca.fyp.dto.response;

import lombok.Builder;
import lombok.Data;
import rw.aauca.fyp.entity.ProposalAttempt;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class ProposalAttemptResponse {
    private UUID id;
    private UUID studentId;
    private int attemptNumber;
    private String status;
    private String rejectionReason;
    private UUID reviewedById;
    private String reviewedByName;
    private Instant submittedAt;
    private Instant reviewedAt;
    private String proposalFileName;

    public static ProposalAttemptResponse from(ProposalAttempt a) {
        return ProposalAttemptResponse.builder()
                .id(a.getId())
                .studentId(a.getStudent().getId())
                .attemptNumber(a.getAttemptNumber())
                .status(a.getStatus().name())
                .rejectionReason(a.getRejectionReason())
                .reviewedById(a.getReviewedBy() != null ? a.getReviewedBy().getId() : null)
                .reviewedByName(a.getReviewedBy() != null ? a.getReviewedBy().getFullName() : null)
                .submittedAt(a.getSubmittedAt())
                .reviewedAt(a.getReviewedAt())
                .proposalFileName(a.getProposalFileName())
                .build();
    }
}
