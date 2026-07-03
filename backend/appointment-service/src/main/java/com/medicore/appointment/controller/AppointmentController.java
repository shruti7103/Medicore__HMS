package com.medicore.appointment.controller;

import com.medicore.common.dto.ApiResponse;
import com.medicore.appointment.dto.AppointmentDtos.*;
import com.medicore.appointment.service.AppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/appointments") @RequiredArgsConstructor
public class AppointmentController {
    private final AppointmentService appointmentService;

    @GetMapping @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','RECEPTIONIST')")
    public ApiResponse<List<AppointmentResponse>> list() { return ApiResponse.ok(appointmentService.findAll()); }

    @GetMapping("/{id}") @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','RECEPTIONIST','PATIENT')")
    public ApiResponse<AppointmentResponse> get(@PathVariable Long id) { return ApiResponse.ok(appointmentService.findById(id)); }

    @GetMapping("/patient/{patientId}") @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','RECEPTIONIST','PATIENT')")
    public ApiResponse<List<AppointmentResponse>> byPatient(@PathVariable Long patientId) { return ApiResponse.ok(appointmentService.byPatient(patientId)); }

    @GetMapping("/doctor/{doctorId}") @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','RECEPTIONIST')")
    public ApiResponse<List<AppointmentResponse>> byDoctor(@PathVariable Long doctorId) { return ApiResponse.ok(appointmentService.byDoctor(doctorId)); }

    @PostMapping @PreAuthorize("hasAnyRole('PATIENT','RECEPTIONIST')")
    public ApiResponse<AppointmentResponse> book(@Valid @RequestBody BookRequest req) { return ApiResponse.ok(appointmentService.book(req)); }

    @PatchMapping("/{id}/status") @PreAuthorize("hasAnyRole('DOCTOR','RECEPTIONIST','ADMIN')")
    public ApiResponse<AppointmentResponse> status(@PathVariable Long id, @Valid @RequestBody StatusRequest req) { return ApiResponse.ok(appointmentService.updateStatus(id, req)); }

    @PutMapping("/{id}/reschedule") @PreAuthorize("hasAnyRole('RECEPTIONIST','PATIENT','ADMIN')")
    public ApiResponse<AppointmentResponse> reschedule(@PathVariable Long id, @Valid @RequestBody BookRequest req) { return ApiResponse.ok(appointmentService.reschedule(id, req)); }
}
