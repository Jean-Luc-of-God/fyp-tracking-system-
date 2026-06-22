package rw.aauca.fyp.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rw.aauca.fyp.entity.Meeting;

import java.util.List;
import java.util.UUID;

public interface MeetingRepository extends JpaRepository<Meeting, UUID> {
    List<Meeting> findByStudentIdOrderByScheduledAtDesc(UUID studentId);
    List<Meeting> findBySupervisorIdOrderByScheduledAtDesc(UUID supervisorId);
}
