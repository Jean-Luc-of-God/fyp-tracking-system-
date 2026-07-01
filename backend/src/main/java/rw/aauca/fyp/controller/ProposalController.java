package rw.aauca.fyp.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import rw.aauca.fyp.dto.request.ProposalReviewRequest;
import rw.aauca.fyp.dto.response.ProposalAttemptResponse;
import rw.aauca.fyp.dto.response.StudentResponse;
import rw.aauca.fyp.entity.Student;
import rw.aauca.fyp.entity.User;
import rw.aauca.fyp.enums.Role;
import rw.aauca.fyp.repository.StudentRepository;
import rw.aauca.fyp.service.ProposalService;

import java.io.IOException;
import java.nio.file.Path;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@RestController
@RequestMapping("/api/proposals")
@RequiredArgsConstructor
public class ProposalController {

    private final ProposalService proposalService;
    private final StudentRepository studentRepository;

    @PostMapping("/{studentId}/submit")
    @PreAuthorize("hasAnyRole('STUDENT','HOD','FACILITATOR','SUPERADMIN')")
    public ResponseEntity<ProposalAttemptResponse> submit(
            @PathVariable UUID studentId,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @AuthenticationPrincipal User actor) throws IOException {
        if (actor.getRole() == Role.STUDENT) {
            Student student = studentRepository.findById(studentId)
                    .orElseThrow(() -> new NoSuchElementException("Student not found"));
            if (student.getUser() == null || !student.getUser().getId().equals(actor.getId())) {
                throw new AccessDeniedException("You may only submit proposals for yourself");
            }
        }
        return ResponseEntity.ok(ProposalAttemptResponse.from(
                proposalService.submit(studentId, actor, file)));
    }

    @GetMapping("/{studentId}/latest-file")
    @PreAuthorize("hasAnyRole('HOD','FACILITATOR','SUPERADMIN','SUPERVISOR','STUDENT')")
    public ResponseEntity<Resource> latestFile(@PathVariable UUID studentId,
                                               @AuthenticationPrincipal User actor) throws IOException {
        if (actor.getRole() == Role.STUDENT) {
            Student student = studentRepository.findById(studentId)
                    .orElseThrow(() -> new NoSuchElementException("Student not found"));
            if (student.getUser() == null || !student.getUser().getId().equals(actor.getId())) {
                throw new AccessDeniedException("You may only access your own proposal");
            }
        }
        Path file = proposalService.getLatestProposalFile(studentId);
        if (file == null) return ResponseEntity.notFound().build();
        Resource resource = new UrlResource(file.toUri());
        if (!resource.exists()) return ResponseEntity.notFound().build();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + file.getFileName() + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }

    @PostMapping("/{studentId}/review")
    @PreAuthorize("hasAnyRole('HOD','FACILITATOR','SUPERADMIN')")
    public ResponseEntity<ProposalAttemptResponse> review(@PathVariable UUID studentId,
                                                          @RequestBody ProposalReviewRequest request,
                                                          @AuthenticationPrincipal User actor) {
        return ResponseEntity.ok(ProposalAttemptResponse.from(
                proposalService.review(studentId, request.getDecision(),
                        request.getRejectionReason(), actor)));
    }

    @PostMapping("/{studentId}/unlock")
    @PreAuthorize("hasAnyRole('HOD','SUPERADMIN')")
    public ResponseEntity<StudentResponse> unlock(@PathVariable UUID studentId,
                                                  @AuthenticationPrincipal User actor) {
        return ResponseEntity.ok(StudentResponse.from(
                proposalService.unlock(studentId, actor)));
    }

    @GetMapping("/{studentId}/history")
    @PreAuthorize("hasAnyRole('STUDENT','SUPERVISOR','HOD','FACILITATOR','SUPERADMIN')")
    public ResponseEntity<List<ProposalAttemptResponse>> history(@PathVariable UUID studentId) {
        return ResponseEntity.ok(proposalService.getHistory(studentId)
                .stream().map(ProposalAttemptResponse::from).toList());
    }
}
