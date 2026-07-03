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

    @GetMapping("/assignments")
    @PreAuthorize("hasRole('NURSE')")
    public ApiResponse<List<AssignmentResponse>> assignments() {
        return ApiResponse.ok(nurseService.assignments());
    }

    @GetMapping("/tasks")
    @PreAuthorize("hasRole('NURSE')")
    public ApiResponse<List<TaskResponse>> tasks() {
        return ApiResponse.ok(nurseService.tasks());
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
}
