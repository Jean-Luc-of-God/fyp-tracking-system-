package rw.aauca.fyp.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import rw.aauca.fyp.entity.PanelAssignment;
import rw.aauca.fyp.enums.PanelType;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PanelAssignmentRepository extends JpaRepository<PanelAssignment, UUID> {
    @Override
    @EntityGraph(attributePaths = {"student", "student.user", "examiner", "assignedBy"})
    Optional<PanelAssignment> findById(UUID id);

    List<PanelAssignment> findByStudentId(UUID studentId);

    @EntityGraph(attributePaths = {"student", "student.user", "examiner", "assignedBy"})
    List<PanelAssignment> findByStudentIdOrderByAssignedAtAsc(UUID studentId);

    @EntityGraph(attributePaths = {"student", "student.user", "examiner", "assignedBy"})
    List<PanelAssignment> findByExaminerIdOrderByAssignedAtAsc(UUID examinerId);

    boolean existsByStudentIdAndPanelTypeAndOutcomeIsNull(UUID studentId, PanelType panelType);
    boolean existsByStudentIdAndExaminerIdAndPanelTypeNot(UUID studentId, UUID examinerId, PanelType panelType);
}
