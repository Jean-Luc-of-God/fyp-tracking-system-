package rw.aauca.fyp.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import rw.aauca.fyp.entity.Student;
import rw.aauca.fyp.entity.User;
import rw.aauca.fyp.enums.StudentState;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StudentRepository extends JpaRepository<Student, UUID> {
    @EntityGraph(attributePaths = {"user", "supervisor"})
    Optional<Student> findByUser(User user);

    @EntityGraph(attributePaths = {"user", "supervisor"})
    Optional<Student> findByUserId(UUID userId);

    @EntityGraph(attributePaths = {"user", "supervisor"})
    Optional<Student> findByRegNumber(String regNumber);

    @EntityGraph(attributePaths = {"user", "supervisor"})
    List<Student> findByState(StudentState state);

    @EntityGraph(attributePaths = {"user", "supervisor"})
    List<Student> findBySupervisorId(UUID supervisorId);

    @EntityGraph(attributePaths = {"user", "supervisor"})
    List<Student> findByFlaggedTrue();

    @EntityGraph(attributePaths = {"user", "supervisor"})
    List<Student> findAll();

    @EntityGraph(attributePaths = {"user", "supervisor"})
    Optional<Student> findById(UUID id);

    @EntityGraph(attributePaths = {"user", "supervisor"})
    @Query("SELECT s FROM Student s WHERE s.supervisor IS NULL AND s.state = 'PROPOSAL_ACCEPTED'")
    List<Student> findUnassigned();
}
