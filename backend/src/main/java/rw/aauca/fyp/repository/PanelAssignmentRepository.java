package rw.aauca.fyp.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rw.aauca.fyp.entity.PanelAssignment;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PanelAssignmentRepository extends JpaRepository<PanelAssignment, UUID> {
    List<PanelAssignment> findByStudentId(UUID studentId);
    List<PanelAssignment> findByExaminerId(UUID examinerId);
    Optional<PanelAssignment> findByStudentIdAndPanelType(UUID studentId, String panelType);
}
