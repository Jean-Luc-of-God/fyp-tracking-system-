package rw.aauca.fyp.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rw.aauca.fyp.entity.PanelAssignment;
import rw.aauca.fyp.enums.PanelType;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PanelAssignmentRepository extends JpaRepository<PanelAssignment, UUID> {
    List<PanelAssignment> findByStudentId(UUID studentId);
    List<PanelAssignment> findByStudentIdOrderByAssignedAtAsc(UUID studentId);
    List<PanelAssignment> findByExaminerIdOrderByAssignedAtAsc(UUID examinerId);
    Optional<PanelAssignment> findByStudentIdAndExaminerIdAndPanelType(UUID studentId, UUID examinerId, PanelType panelType);
    boolean existsByStudentIdAndExaminerIdAndPanelType(UUID studentId, UUID examinerId, PanelType panelType);
}
