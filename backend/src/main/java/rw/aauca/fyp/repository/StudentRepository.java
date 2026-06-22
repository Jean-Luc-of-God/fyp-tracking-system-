package rw.aauca.fyp.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import rw.aauca.fyp.entity.Student;
import rw.aauca.fyp.entity.User;
import rw.aauca.fyp.enums.StudentState;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StudentRepository extends JpaRepository<Student, UUID> {
    Optional<Student> findByUser(User user);
    Optional<Student> findByUserId(UUID userId);
    Optional<Student> findByRegNumber(String regNumber);
    List<Student> findByState(StudentState state);
    List<Student> findBySupervisorId(UUID supervisorId);
    List<Student> findByFlaggedTrue();

    @Query("SELECT s FROM Student s WHERE s.supervisor IS NULL AND s.state = 'PROPOSAL_ACCEPTED'")
    List<Student> findUnassigned();
}
