package com.medicore.doctor.controller;

import com.medicore.common.dto.ApiResponse;
import com.medicore.doctor.dto.DoctorDtos.*;
import com.medicore.doctor.service.DoctorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController @RequestMapping("/doctors") @RequiredArgsConstructor
public class DoctorController {
    private final DoctorService doctorService;

    @GetMapping @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','RECEPTIONIST','PATIENT')")
    public ApiResponse<List<DoctorResponse>> list() { return ApiResponse.ok(doctorService.findAll()); }

    @GetMapping("/me") @PreAuthorize("hasRole('DOCTOR')")
    public ApiResponse<DoctorResponse> me() { return ApiResponse.ok(doctorService.me()); }

    @GetMapping("/{id}") @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','RECEPTIONIST','PATIENT')")
    public ApiResponse<DoctorResponse> get(@PathVariable Long id) { return ApiResponse.ok(doctorService.findById(id)); }

    @PostMapping @PreAuthorize("hasAnyRole('ADMIN','DOCTOR')")
    public ApiResponse<DoctorResponse> create(@Valid @RequestBody DoctorRequest req) { return ApiResponse.ok(doctorService.create(req)); }

    @PutMapping("/{id}") @PreAuthorize("hasAnyRole('ADMIN','DOCTOR')")
    public ApiResponse<DoctorResponse> update(@PathVariable Long id, @Valid @RequestBody DoctorRequest req) { return ApiResponse.ok(doctorService.update(id, req)); }

    @PostMapping("/{id}/slots") @PreAuthorize("hasAnyRole('ADMIN','DOCTOR')")
    public ApiResponse<SlotResponse> addSlot(@PathVariable Long id, @Valid @RequestBody SlotRequest req) { return ApiResponse.ok(doctorService.addSlot(id, req)); }

    @GetMapping("/{id}/slots") @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','RECEPTIONIST','PATIENT')")
    public ApiResponse<?> slots(@PathVariable Long id, @RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate date) {
        if (date != null) return ApiResponse.ok(doctorService.openSlots(id, date));
        return ApiResponse.ok(doctorService.listSlots(id));
    }
}
