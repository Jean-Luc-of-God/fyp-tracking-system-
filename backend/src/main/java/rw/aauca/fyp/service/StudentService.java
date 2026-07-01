package rw.aauca.fyp.service;

import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import rw.aauca.fyp.entity.Student;
import rw.aauca.fyp.entity.User;
import rw.aauca.fyp.enums.Role;
import rw.aauca.fyp.enums.StudentState;
import rw.aauca.fyp.repository.StudentRepository;
import rw.aauca.fyp.repository.UserRepository;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;
    private final StudentStateService stateService;
    private final EmailService emailService;

    public List<Student> getAll() {
        return studentRepository.findAll();
    }

    public List<Student> getByState(StudentState state) {
        return studentRepository.findByState(state);
    }

    public Student getById(UUID id) {
        return studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found: " + id));
    }

    public Student getByUserId(UUID userId) {
        return studentRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("No student record linked to this account"));
    }

    @Transactional
    public Student updateDetails(UUID studentId, String projectTopic, String organisation,
                                  String groupLabel, User actor) {
        Student student = getById(studentId);
        if (projectTopic  != null) student.setProjectTopic(projectTopic.isBlank()  ? null : projectTopic.trim());
        if (organisation  != null) student.setOrganisation(organisation.isBlank()  ? null : organisation.trim());
        if (groupLabel    != null) student.setGroupLabel(groupLabel.isBlank()       ? null : groupLabel.trim());
        student = studentRepository.save(student);
        auditService.log(actor, "UPDATE_DETAILS", "Student", student.getId(), "Updated project details", null);
        return student;
    }

    @Transactional
    public Student assignSupervisor(UUID studentId, UUID supervisorId, User actor) {
        Student student = getById(studentId);
        User supervisor = userRepository.findById(supervisorId)
                .orElseThrow(() -> new RuntimeException("Supervisor not found: " + supervisorId));

        if (student.getState() != StudentState.PROPOSAL_ACCEPTED) {
            throw new IllegalStateException(
                    "A supervisor can only be assigned once the student's proposal has been accepted. "
                            + student.getUser().getFullName() + " is currently at: "
                            + friendlyStateName(student.getState()));
        }

        student.setSupervisor(supervisor);
        student.setSupervisorAssignedAt(Instant.now());

        // Transition to SUPERVISION state
        stateService.transition(student, StudentState.SUPERVISION, actor,
                "Supervisor assigned: " + supervisor.getFullName());

        auditService.log(actor, "ASSIGN_SUPERVISOR", "Student", studentId,
                "Assigned supervisor " + supervisor.getFullName(), null);

        return studentRepository.save(student);
    }

    private static String friendlyStateName(StudentState state) {
        return switch (state) {
            case REGISTERED -> "Registered";
            case CASE_LETTER_SUBMITTED -> "Case Letter Submitted";
            case CASE_LETTER_APPROVED -> "Case Letter Approved";
            case PROTOTYPE_REVIEW -> "Prototype Review";
            case PROTOTYPE_GRANTED -> "Prototype Granted";
            case PROPOSAL_UNDER_REVIEW -> "Proposal Under Review";
            case PROPOSAL_ACCEPTED -> "Proposal Accepted";
            case SUPERVISION -> "Supervision";
            case BOOK_SUBMITTED -> "Book Submitted";
            case PRE_DEFENSE -> "Pre-Defense";
            case DEFENSE -> "Defense";
            case COMPLETED -> "Completed";
            case WITHDRAWN -> "Withdrawn";
        };
    }

    @Transactional
    public Student signOffBook(UUID studentId, User supervisor) {
        Student student = getById(studentId);
        if (student.getSupervisor() == null || !student.getSupervisor().getId().equals(supervisor.getId())) {
            throw new AccessDeniedException("You are not the assigned supervisor for this student");
        }
        student.setBookSignedOff(true);
        student.setBookSignedOffAt(Instant.now());
        Student saved = studentRepository.save(student);
        auditService.log(supervisor, "SIGN_OFF_BOOK", "Student", studentId,
                "Book signed off by supervisor " + supervisor.getFullName(), null);
        emailService.notifyBookSignedOff(student.getUser(), student);
        return saved;
    }

    @Transactional
    public Student markBookSubmitted(UUID studentId, User hod) {
        Student student = getById(studentId);
        if (!student.isBookSignedOff()) {
            throw new IllegalStateException(
                    "The supervisor must sign off the book before it can be marked as received");
        }
        stateService.transition(student, StudentState.BOOK_SUBMITTED, hod, "Book received by HOD office");
        auditService.log(hod, "BOOK_RECEIVED", "Student", studentId,
                "Book physically received at HOD office", null);
        return studentRepository.save(student);
    }

    @Transactional
    public Student flagStudent(UUID studentId, String note, User actor) {
        Student student = getById(studentId);
        student.setFlagged(true);
        student.setNote(note);
        studentRepository.save(student);
        auditService.log(actor, "FLAG_STUDENT", "Student", studentId, note, null);
        return student;
    }

    @Transactional
    public Student withdrawStudent(UUID studentId, String note, User actor) {
        Student student = getById(studentId);
        stateService.transition(student, StudentState.WITHDRAWN, actor, note);
        return studentRepository.save(student);
    }

    @Transactional
    public void saveLetterFile(Student student, MultipartFile file) throws IOException {
        Path uploadDir = Paths.get("uploads/case-letters/" + student.getId());
        Files.createDirectories(uploadDir);
        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "letter";
        String safeName = originalName.replaceAll("[^a-zA-Z0-9._-]", "_");
        file.transferTo(uploadDir.resolve(safeName));
        student.setLetterFileName(safeName);
        studentRepository.save(student);
    }

    @Transactional
    public void saveRequirementsFile(Student student, MultipartFile file) throws IOException {
        Path uploadDir = Paths.get("uploads/requirements/" + student.getId());
        Files.createDirectories(uploadDir);
        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "requirements";
        String safeName = originalName.replaceAll("[^a-zA-Z0-9._-]", "_");
        file.transferTo(uploadDir.resolve(safeName));
        student.setRequirementsFileName(safeName);
        studentRepository.save(student);
    }

    /**
     * Import students from an Excel file uploaded by the HOD.
     * Expected columns: reg_number, full_name, email, phone (optional), organisation (optional), group (optional)
     */
    @Transactional
    public Student createStudent(String fullName, String email, String regNumber,
                                 String phone, String org, String groupLabel,
                                 String password, User actor) {
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already in use: " + email);
        }
        String rawPassword = (password != null && !password.isBlank()) ? password : regNumber;
        User user = User.builder()
                .email(email)
                .fullName(fullName)
                .phone(phone)
                .role(Role.STUDENT)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .enabled(true)
                .build();
        userRepository.save(user);

        Student student = Student.builder()
                .user(user)
                .regNumber(regNumber)
                .organisation(org)
                .groupLabel(groupLabel)
                .state(StudentState.REGISTERED)
                .stateEnteredAt(Instant.now())
                .build();
        studentRepository.save(student);

        auditService.log(actor, "CREATE_STUDENT", "Student", student.getId(),
                "Created student account for " + email + " (" + regNumber + ")", null);
        return student;
    }

    @Transactional
    public List<Student> importFromExcel(MultipartFile file, User actor) throws IOException {
        List<Student> imported = new ArrayList<>();

        try (Workbook wb = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = wb.getSheetAt(0);
            Row header = sheet.getRow(0);

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                String regNumber = cellStr(row, 0);
                String fullName  = cellStr(row, 1);
                String email     = cellStr(row, 2);
                String phone     = cellStr(row, 3);
                String org       = cellStr(row, 4);
                String group     = cellStr(row, 5);

                if (regNumber.isBlank() || email.isBlank() || fullName.isBlank()) continue;
                if (userRepository.existsByEmail(email)) continue;

                User user = User.builder()
                        .email(email)
                        .fullName(fullName)
                        .phone(phone)
                        .role(Role.STUDENT)
                        .passwordHash(passwordEncoder.encode(regNumber)) // default password = reg number
                        .enabled(true)
                        .build();
                userRepository.save(user);

                Student student = Student.builder()
                        .user(user)
                        .regNumber(regNumber)
                        .organisation(org)
                        .groupLabel(group)
                        .state(StudentState.REGISTERED)
                        .stateEnteredAt(Instant.now())
                        .build();
                studentRepository.save(student);
                imported.add(student);
            }
        }

        auditService.log(actor, "IMPORT_STUDENTS", imported.size() + " students imported from Excel");
        return imported;
    }

    private String cellStr(Row row, int col) {
        Cell cell = row.getCell(col);
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING  -> cell.getStringCellValue().trim();
            case NUMERIC -> String.valueOf((long) cell.getNumericCellValue());
            default      -> "";
        };
    }
}
