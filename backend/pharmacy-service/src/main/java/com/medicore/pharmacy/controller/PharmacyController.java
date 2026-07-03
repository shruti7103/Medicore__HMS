package com.medicore.pharmacy.controller;

import com.medicore.common.dto.ApiResponse;
import com.medicore.pharmacy.dto.PharmacyDtos.*;
import com.medicore.pharmacy.service.PharmacyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/pharmacy") @RequiredArgsConstructor
public class PharmacyController {
    private final PharmacyService pharmacyService;

    @GetMapping("/medicines") @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST','DOCTOR')")
    public ApiResponse<List<MedicineResponse>> medicines() { return ApiResponse.ok(pharmacyService.listMedicines()); }

    @GetMapping("/medicines/low-stock") @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST')")
    public ApiResponse<List<MedicineResponse>> lowStock() { return ApiResponse.ok(pharmacyService.lowStock()); }

    @PostMapping("/medicines") @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST')")
    public ApiResponse<MedicineResponse> addMedicine(@Valid @RequestBody MedicineRequest req) { return ApiResponse.ok(pharmacyService.addMedicine(req)); }

    @GetMapping("/prescriptions") @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST','DOCTOR')")
    public ApiResponse<List<PrescriptionResponse>> pending() { return ApiResponse.ok(pharmacyService.pendingPrescriptions()); }

    @GetMapping("/prescriptions/patient/{patientId}") @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST','DOCTOR','PATIENT')")
    public ApiResponse<List<PrescriptionResponse>> byPatient(@PathVariable Long patientId) { return ApiResponse.ok(pharmacyService.byPatient(patientId)); }

    @PostMapping("/prescriptions") @PreAuthorize("hasRole('DOCTOR')")
    public ApiResponse<PrescriptionResponse> create(@Valid @RequestBody PrescriptionRequest req) { return ApiResponse.ok(pharmacyService.create(req)); }

    @PatchMapping("/prescriptions/{id}/dispense") @PreAuthorize("hasRole('PHARMACIST')")
    public ApiResponse<PrescriptionResponse> dispense(@PathVariable Long id) { return ApiResponse.ok(pharmacyService.dispense(id)); }
}
