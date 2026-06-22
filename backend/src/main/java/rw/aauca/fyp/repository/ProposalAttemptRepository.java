package rw.aauca.fyp.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rw.aauca.fyp.entity.ProposalAttempt;

import java.util.List;
import java.util.UUID;

public interface ProposalAttemptRepository extends JpaRepository<ProposalAttempt, UUID> {
    List<ProposalAttempt> findByStudentIdOrderByAttemptNumberAsc(UUID studentId);
    int countByStudentId(UUID studentId);
}
