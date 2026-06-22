package rw.aauca.fyp.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rw.aauca.fyp.entity.StateTransition;

import java.util.List;
import java.util.UUID;

public interface StateTransitionRepository extends JpaRepository<StateTransition, UUID> {
    List<StateTransition> findByStudentIdOrderByCreatedAtAsc(UUID studentId);
}
