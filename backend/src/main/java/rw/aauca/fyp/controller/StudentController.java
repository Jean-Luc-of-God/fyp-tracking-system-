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

import java.io.IOException;
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

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('HOD','FACILITATOR','SUPERADMIN','SUPERVISOR','STUDENT')")
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

    @PostMapping("/import")
    @PreAuthorize("hasAnyRole('HOD','SUPERADMIN')")
    public ResponseEntity<?> importStudents(@RequestParam("file") MultipartFile file,
                                            @AuthenticationPrincipal User actor) throws IOException {
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

    @PostMapping("/{id}/transition")
    @PreAuthorize("hasAnyRole('HOD','FACILITATOR','SUPERADMIN','SUPERVISOR','EXAMINER')")
    public ResponseEntity<StudentResponse> transition(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User actor) {
        var student = studentService.getById(id);
        var toState = StudentState.valueOf(body.get("state").toUpperCase());
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
}
