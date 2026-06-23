package rw.aauca.fyp.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rw.aauca.fyp.entity.AvailabilitySlot;

import java.util.List;
import java.util.UUID;

public interface AvailabilitySlotRepository extends JpaRepository<AvailabilitySlot, UUID> {
    List<AvailabilitySlot> findBySupervisorIdAndActiveTrue(UUID supervisorId);
}
