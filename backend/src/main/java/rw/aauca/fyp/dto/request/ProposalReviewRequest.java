package rw.aauca.fyp.dto.request;

import lombok.Data;
import rw.aauca.fyp.enums.ProposalStatus;

@Data
public class ProposalReviewRequest {
    private ProposalStatus decision;   // ACCEPTED or REJECTED
    private String rejectionReason;    // required when decision is REJECTED
}
