package rw.aauca.fyp.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import rw.aauca.fyp.entity.ProposalAttempt;
import rw.aauca.fyp.enums.ProposalStatus;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProposalAttemptRepository extends JpaRepository<ProposalAttempt, UUID> {
    @EntityGraph(attributePaths = {"student", "reviewedBy"})
    List<ProposalAttempt> findByStudentIdOrderByAttemptNumberAsc(UUID studentId);
    int countByStudentId(UUID studentId);
    int countByStudentIdAndStatus(UUID studentId, ProposalStatus status);
    @EntityGraph(attributePaths = {"student", "reviewedBy"})
    Optional<ProposalAttempt> findFirstByStudentIdAndStatus(UUID studentId, ProposalStatus status);
}
