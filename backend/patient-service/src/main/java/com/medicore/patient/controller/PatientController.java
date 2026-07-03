package com.medicore.patient.controller;

import com.medicore.common.dto.ApiResponse;
import com.medicore.patient.dto.PatientDtos.*;
import com.medicore.patient.service.PatientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/patients")
@RequiredArgsConstructor
public class PatientController {
    private final PatientService patientService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','RECEPTIONIST')")
    public ApiResponse<List<PatientResponse>> list() {
        return ApiResponse.ok(patientService.findAll());
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('PATIENT')")
    public ApiResponse<PatientResponse> me() {
        return ApiResponse.ok(patientService.me());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','RECEPTIONIST','PATIENT')")
    public ApiResponse<PatientResponse> get(@PathVariable Long id) {
        return ApiResponse.ok(patientService.findById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('PATIENT')")
    public ApiResponse<PatientResponse> create(@Valid @RequestBody PatientRequest req) {
        return ApiResponse.ok(patientService.create(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST','PATIENT')")
    public ApiResponse<PatientResponse> update(@PathVariable Long id, @Valid @RequestBody PatientRequest req) {
        return ApiResponse.ok(patientService.update(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        patientService.delete(id);
        return ApiResponse.ok("Deleted", null);
    }

    @PostMapping("/{id}/history")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR')")
    public ApiResponse<MedicalHistoryResponse> addHistory(@PathVariable Long id, @Valid @RequestBody MedicalHistoryRequest req) {
        return ApiResponse.ok(patientService.addHistory(id, req));
    }

    @PostMapping("/{id}/vitals")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','RECEPTIONIST','NURSE')")
    public ApiResponse<VitalsResponse> addVitals(@PathVariable Long id, @Valid @RequestBody VitalsRequest req) {
        return ApiResponse.ok(patientService.addVitals(id, req));
    }

    @PostMapping("/{id}/allergies")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','RECEPTIONIST','PATIENT')")
    public ApiResponse<AllergyResponse> addAllergy(@PathVariable Long id, @Valid @RequestBody AllergyRequest req) {
        return ApiResponse.ok(patientService.addAllergy(id, req));
    }
}
