package rw.aauca.fyp.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rw.aauca.fyp.entity.WhatsAppGroup;

import java.util.List;
import java.util.UUID;

public interface WhatsAppGroupRepository extends JpaRepository<WhatsAppGroup, UUID> {
    List<WhatsAppGroup> findBySupervisorId(UUID supervisorId);
    List<WhatsAppGroup> findBySupervisorIdAndPredefenseFalse(UUID supervisorId);
    List<WhatsAppGroup> findBySupervisorIdAndPredefenseTrue(UUID supervisorId);
}
