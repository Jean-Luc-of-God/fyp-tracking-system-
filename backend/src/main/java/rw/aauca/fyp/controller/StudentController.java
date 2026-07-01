package rw.aauca.fyp.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import rw.aauca.fyp.dto.response.StudentResponse;
import rw.aauca.fyp.entity.User;
import rw.aauca.fyp.enums.StudentState;
import rw.aauca.fyp.service.StudentService;
import rw.aauca.fyp.service.StudentStateService;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;
    private final StudentStateService stateService;

    @GetMapping
    @PreAuthorize("hasAnyRole('HOD','FACILITATOR','SUPERADMIN','SUPERVISOR')")
    public ResponseEntity<List<StudentResponse>> getAll() {
        return ResponseEntity.ok(studentService.getAll().stream()
                .map(StudentResponse::from).toList());
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<StudentResponse> getMe(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(StudentResponse.from(studentService.getByUserId(currentUser.getId())));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('HOD','FACILITATOR','SUPERADMIN','SUPERVISOR')")
    public ResponseEntity<StudentResponse> getOne(@PathVariable UUID id) {
        return ResponseEntity.ok(StudentResponse.from(studentService.getById(id)));
    }

    @GetMapping("/state/{state}")
    @PreAuthorize("hasAnyRole('HOD','FACILITATOR','SUPERADMIN')")
    public ResponseEntity<List<StudentResponse>> getByState(@PathVariable String state) {
        return ResponseEntity.ok(
                studentService.getByState(StudentState.valueOf(state.toUpperCase()))
                        .stream().map(StudentResponse::from).toList());
    }

    private static final long MAX_EXCEL_BYTES = 5 * 1024 * 1024; // 5 MB

    @PostMapping("/import")
    @PreAuthorize("hasAnyRole('HOD','SUPERADMIN')")
    public ResponseEntity<?> importStudents(@RequestParam("file") MultipartFile file,
                                            @AuthenticationPrincipal User actor) throws IOException {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "No file provided"));
        }
        if (file.getSize() > MAX_EXCEL_BYTES) {
            return ResponseEntity.badRequest().body(Map.of("message", "File exceeds 5 MB limit"));
        }
        String ct = file.getContentType();
        if (ct == null
                || (!ct.equals("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                    && !ct.equals("application/vnd.ms-excel"))) {
            return ResponseEntity.badRequest().body(Map.of("message", "Only .xlsx and .xls files are accepted"));
        }
        var imported = studentService.importFromExcel(file, actor);
        return ResponseEntity.ok(Map.of("imported", imported.size()));
    }

    @PostMapping("/{id}/assign-supervisor")
    @PreAuthorize("hasAnyRole('HOD','SUPERADMIN')")
    public ResponseEntity<StudentResponse> assignSupervisor(
            @PathVariable UUID id,
            @RequestBody Map<String, UUID> body,
            @AuthenticationPrincipal User actor) {
        return ResponseEntity.ok(StudentResponse.from(
                studentService.assignSupervisor(id, body.get("supervisorId"), actor)));
    }

    @PostMapping("/{id}/sign-off-book")
    @PreAuthorize("hasRole('SUPERVISOR')")
    public ResponseEntity<StudentResponse> signOffBook(@PathVariable UUID id,
                                                       @AuthenticationPrincipal User actor) {
        return ResponseEntity.ok(StudentResponse.from(studentService.signOffBook(id, actor)));
    }

    @PostMapping("/{id}/mark-book-submitted")
    @PreAuthorize("hasAnyRole('HOD','FACILITATOR','SUPERADMIN')")
    public ResponseEntity<StudentResponse> markBookSubmitted(@PathVariable UUID id,
                                                             @AuthenticationPrincipal User actor) {
        return ResponseEntity.ok(StudentResponse.from(studentService.markBookSubmitted(id, actor)));
    }

    @PostMapping("/create")
    @PreAuthorize("hasAnyRole('HOD','FACILITATOR','SUPERADMIN')")
    public ResponseEntity<StudentResponse> createStudent(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User actor) {
        var student = studentService.createStudent(
                body.get("fullName"),
                body.get("email"),
                body.get("regNumber"),
                body.getOrDefault("phone", null),
                body.getOrDefault("org", null),
                body.getOrDefault("groupLabel", null),
                body.getOrDefault("password", null),
                actor);
        return ResponseEntity.ok(StudentResponse.from(student));
    }

    @PatchMapping("/me/details")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<StudentResponse> updateMyDetails(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User actor) {
        var student = studentService.getByUserId(actor.getId());
        var updated = studentService.updateDetails(student.getId(),
                body.get("projectTopic"), body.get("organisation"), body.get("groupLabel"), actor);
        return ResponseEntity.ok(StudentResponse.from(updated));
    }

    @PostMapping("/{id}/reject-case-letter")
    @PreAuthorize("hasAnyRole('HOD','FACILITATOR','SUPERADMIN')")
    public ResponseEntity<StudentResponse> rejectCaseLetter(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User actor) {
        var student = studentService.getById(id);
        String reason = body.getOrDefault("reason", "Returned for revision");
        student.setLetterRejectionReason(reason);
        var updated = stateService.transition(student, StudentState.REGISTERED, actor,
                "Case letter returned: " + reason);
        return ResponseEntity.ok(StudentResponse.from(updated));
    }

    @PostMapping("/me/submit-case-letter")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<StudentResponse> submitCaseLetter(
            @AuthenticationPrincipal User actor,
            @RequestParam(value = "file", required = false) MultipartFile file) throws IOException {
        var student = studentService.getByUserId(actor.getId());
        if (student.getProjectTopic() == null || student.getProjectTopic().isBlank()) {
            throw new RuntimeException("Please set your project topic before submitting your case study letter.");
        }
        if (student.getOrganisation() == null || student.getOrganisation().isBlank()) {
            throw new RuntimeException("Please set your case study organisation before submitting.");
        }
        if (file != null && !file.isEmpty()) {
            studentService.saveLetterFile(student, file);
        }
        var transitioned = stateService.transition(student, StudentState.CASE_LETTER_SUBMITTED, actor, null);
        var reloaded = studentService.getById(transitioned.getId());
        return ResponseEntity.ok(StudentResponse.from(reloaded));
    }

    @PostMapping("/{id}/transition")
    @PreAuthorize("hasAnyRole('HOD','FACILITATOR','SUPERADMIN')")
    public ResponseEntity<StudentResponse> transition(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User actor) {
        String stateStr = body.get("state");
        if (stateStr == null || stateStr.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        var student = studentService.getById(id);
        var toState = StudentState.valueOf(stateStr.toUpperCase());
        var note    = body.getOrDefault("note", null);
        return ResponseEntity.ok(StudentResponse.from(stateService.transition(student, toState, actor, note)));
    }

    @PostMapping("/{id}/flag")
    @PreAuthorize("hasAnyRole('HOD','FACILITATOR','SUPERADMIN','SUPERVISOR')")
    public ResponseEntity<StudentResponse> flag(@PathVariable UUID id,
                                                @RequestBody Map<String, String> body,
                                                @AuthenticationPrincipal User actor) {
        return ResponseEntity.ok(StudentResponse.from(
                studentService.flagStudent(id, body.get("note"), actor)));
    }

    @PostMapping("/{id}/withdraw")
    @PreAuthorize("hasAnyRole('HOD','FACILITATOR','SUPERADMIN')")
    public ResponseEntity<StudentResponse> withdraw(@PathVariable UUID id,
                                                    @RequestBody Map<String, String> body,
                                                    @AuthenticationPrincipal User actor) {
        return ResponseEntity.ok(StudentResponse.from(
                studentService.withdrawStudent(id, body.getOrDefault("note", null), actor)));
    }

    @PostMapping("/{id}/requirements-doc")
    @PreAuthorize("hasAnyRole('HOD','FACILITATOR','SUPERADMIN')")
    public ResponseEntity<StudentResponse> uploadRequirementsDoc(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file) throws IOException {
        var student = studentService.getById(id);
        studentService.saveRequirementsFile(student, file);
        return ResponseEntity.ok(StudentResponse.from(studentService.getById(id)));
    }

    @GetMapping("/{id}/requirements-doc")
    @PreAuthorize("hasAnyRole('HOD','FACILITATOR','SUPERADMIN','SUPERVISOR')")
    public ResponseEntity<Resource> downloadRequirementsDoc(@PathVariable UUID id) throws IOException {
        var student = studentService.getById(id);
        if (student.getRequirementsFileName() == null) return ResponseEntity.notFound().build();
        Path file = Paths.get("uploads/requirements/" + id + "/" + student.getRequirementsFileName());
        Resource resource = new UrlResource(file.toUri());
        if (!resource.exists()) return ResponseEntity.notFound().build();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + student.getRequirementsFileName() + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }

    @GetMapping("/me/requirements-doc")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Resource> downloadMyRequirementsDoc(@AuthenticationPrincipal User actor) throws IOException {
        var student = studentService.getByUserId(actor.getId());
        if (student.getRequirementsFileName() == null) return ResponseEntity.notFound().build();
        Path file = Paths.get("uploads/requirements/" + student.getId() + "/" + student.getRequirementsFileName());
        Resource resource = new UrlResource(file.toUri());
        if (!resource.exists()) return ResponseEntity.notFound().build();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + student.getRequirementsFileName() + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }

    @GetMapping("/me/letter-file")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Resource> downloadMyLetterFile(@AuthenticationPrincipal User actor) throws IOException {
        var student = studentService.getByUserId(actor.getId());
        if (student.getLetterFileName() == null) {
            return ResponseEntity.notFound().build();
        }
        Path file = Paths.get("uploads/case-letters/" + student.getId() + "/" + student.getLetterFileName());
        Resource resource = new UrlResource(file.toUri());
        if (!resource.exists()) return ResponseEntity.notFound().build();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + student.getLetterFileName() + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }

    @GetMapping("/{id}/letter-file")
    @PreAuthorize("hasAnyRole('HOD','FACILITATOR','SUPERADMIN','SUPERVISOR')")
    public ResponseEntity<Resource> downloadLetterFile(@PathVariable UUID id) throws IOException {
        var student = studentService.getById(id);
        if (student.getLetterFileName() == null) {
            return ResponseEntity.notFound().build();
        }
        Path file = Paths.get("uploads/case-letters/" + id + "/" + student.getLetterFileName());
        Resource resource = new UrlResource(file.toUri());
        if (!resource.exists()) return ResponseEntity.notFound().build();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + student.getLetterFileName() + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }
}
