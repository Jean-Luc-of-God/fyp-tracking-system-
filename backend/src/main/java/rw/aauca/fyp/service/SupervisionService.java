package rw.aauca.fyp.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rw.aauca.fyp.dto.request.AvailabilitySlotRequest;
import rw.aauca.fyp.dto.request.MeetingOutcomeRequest;
import rw.aauca.fyp.dto.request.ScheduleMeetingRequest;
import rw.aauca.fyp.entity.AvailabilitySlot;
import rw.aauca.fyp.entity.Meeting;
import rw.aauca.fyp.entity.Student;
import rw.aauca.fyp.entity.User;
import rw.aauca.fyp.repository.AvailabilitySlotRepository;
import rw.aauca.fyp.repository.MeetingRepository;
import rw.aauca.fyp.repository.StudentRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SupervisionService {

    private final AvailabilitySlotRepository slotRepo;
    private final MeetingRepository meetingRepo;
    private final StudentRepository studentRepo;
    private final AuditService auditService;

    // ── Availability slots ────────────────────────────────────────────────

    public AvailabilitySlot addSlot(AvailabilitySlotRequest req, User supervisor) {
        AvailabilitySlot slot = AvailabilitySlot.builder()
                .supervisor(supervisor)
                .dayOfWeek(req.getDayOfWeek().toUpperCase())
                .startTime(req.getStartTime())
                .endTime(req.getEndTime())
                .location(req.getLocation())
                .build();
        return slotRepo.save(slot);
    }

    public List<AvailabilitySlot> getMySlots(User supervisor) {
        return slotRepo.findBySupervisorIdAndActiveTrue(supervisor.getId());
    }

    public List<AvailabilitySlot> getSlotsForSupervisor(UUID supervisorId) {
        return slotRepo.findBySupervisorIdAndActiveTrue(supervisorId);
    }

    @Transactional
    public void deleteSlot(UUID slotId, User supervisor) {
        AvailabilitySlot slot = slotRepo.findById(slotId)
                .orElseThrow(() -> new IllegalArgumentException("Slot not found"));
        if (!slot.getSupervisor().getId().equals(supervisor.getId())) {
            throw new IllegalStateException("Not your slot");
        }
        slot.setActive(false);
        slotRepo.save(slot);
    }

    // ── Meetings ──────────────────────────────────────────────────────────

    @Transactional
    public Meeting scheduleMeeting(ScheduleMeetingRequest req, User supervisor) {
        Student student = studentRepo.findById(req.getStudentId())
                .orElseThrow(() -> new IllegalArgumentException("Student not found"));

        if (!student.getSupervisor().getId().equals(supervisor.getId())) {
            throw new IllegalStateException("This student is not assigned to you");
        }

        Meeting meeting = Meeting.builder()
                .student(student)
                .supervisor(supervisor)
                .scheduledAt(req.getScheduledAt())
                .topic(req.getTopic())
                .meetingType(req.getMeetingType())
                .location(req.getLocation())
                .meetLink(req.getMeetLink())
                .build();

        Meeting saved = meetingRepo.save(meeting);
        auditService.log(supervisor, "MEETING_SCHEDULED",
                "Meeting scheduled for student " + student.getUser().getEmail() + " at " + req.getScheduledAt());
        return saved;
    }

    @Transactional
    public Meeting confirmMeeting(UUID meetingId, User supervisor) {
        Meeting meeting = meetingRepo.findById(meetingId)
                .orElseThrow(() -> new IllegalArgumentException("Meeting not found"));
        if (!meeting.getSupervisor().getId().equals(supervisor.getId())) {
            throw new IllegalStateException("Not your meeting");
        }
        meeting.setConfirmed(true);
        meeting.setConfirmedAt(Instant.now());
        return meetingRepo.save(meeting);
    }

    @Transactional
    public Meeting recordOutcome(UUID meetingId, MeetingOutcomeRequest req, User supervisor) {
        Meeting meeting = meetingRepo.findById(meetingId)
                .orElseThrow(() -> new IllegalArgumentException("Meeting not found"));
        if (!meeting.getSupervisor().getId().equals(supervisor.getId())) {
            throw new IllegalStateException("Not your meeting");
        }
        meeting.setAttended(req.getAttended());
        meeting.setNotes(req.getNotes());
        return meetingRepo.save(meeting);
    }

    public List<Meeting> getMeetingsForStudent(UUID studentId) {
        return meetingRepo.findByStudentIdOrderByScheduledAtDesc(studentId);
    }

    public List<Meeting> getMeetingsForSupervisor(User supervisor) {
        return meetingRepo.findBySupervisorIdOrderByScheduledAtDesc(supervisor.getId());
    }
}
