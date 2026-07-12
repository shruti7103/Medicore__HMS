package com.medicore.nurse.controller;

import com.medicore.common.dto.ApiResponse;
import com.medicore.nurse.dto.NurseDtos.*;
import com.medicore.nurse.service.NurseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/nurse")
@RequiredArgsConstructor
public class NurseController {
    private final NurseService nurseService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE')")
    public ApiResponse<List<NurseResponse>> listNurses() {
        return ApiResponse.ok(nurseService.findAllNurses());
    }

    @GetMapping("/assignments")
    @PreAuthorize("hasAnyRole('NURSE','DOCTOR','ADMIN')")
    public ApiResponse<List<AssignmentResponse>> assignments() {
        return ApiResponse.ok(nurseService.assignments());
    }

    @GetMapping("/assignments/all")
    @PreAuthorize("hasAnyRole('NURSE','DOCTOR','ADMIN')")
    public ApiResponse<List<AssignmentResponse>> allAssignments() {
        return ApiResponse.ok(nurseService.findAllAssignments());
    }

    @PostMapping("/assignments")
    @PreAuthorize("hasAnyRole('DOCTOR','ADMIN')")
    public ApiResponse<AssignmentResponse> createAssignment(@Valid @RequestBody AssignmentRequest req) {
        return ApiResponse.ok(nurseService.assignPatient(req));
    }

    @GetMapping("/tasks")
    @PreAuthorize("hasAnyRole('NURSE','DOCTOR','ADMIN')")
    public ApiResponse<List<TaskResponse>> tasks() {
        return ApiResponse.ok(nurseService.tasks());
    }

    @PostMapping("/tasks")
    @PreAuthorize("hasAnyRole('DOCTOR','ADMIN')")
    public ApiResponse<TaskResponse> createTask(@Valid @RequestBody TaskRequest req) {
        return ApiResponse.ok(nurseService.createTask(req));
    }

    @PatchMapping("/tasks/{id}/complete")
    @PreAuthorize("hasRole('NURSE')")
    public ApiResponse<TaskResponse> complete(@PathVariable Long id) {
        return ApiResponse.ok(nurseService.completeTask(id));
    }

    @PostMapping("/medication-log")
    @PreAuthorize("hasRole('NURSE')")
    public ApiResponse<Void> medLog(@Valid @RequestBody MedLogRequest req) {
        nurseService.logMedication(req);
        return ApiResponse.ok("Medication logged", null);
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('NURSE')")
    public ApiResponse<NurseResponse> me() {
        return ApiResponse.ok(nurseService.getNurseProfile());
    }

    @PostMapping
    @PreAuthorize("hasRole('NURSE')")
    public ApiResponse<NurseResponse> createNurse(@Valid @RequestBody NurseRequest req) {
        return ApiResponse.ok(nurseService.createNurse(req));
    }
}
