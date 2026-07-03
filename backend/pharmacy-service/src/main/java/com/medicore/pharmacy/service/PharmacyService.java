package com.medicore.pharmacy.service;

import com.medicore.common.exception.BadRequestException;
import com.medicore.common.exception.ResourceNotFoundException;
import com.medicore.pharmacy.dto.PharmacyDtos.*;
import com.medicore.pharmacy.entity.*;
import com.medicore.pharmacy.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor
public class PharmacyService {
    private final MedicineRepository medicineRepository;
    private final PrescriptionRepository prescriptionRepository;

    public List<MedicineResponse> listMedicines() {
        return medicineRepository.findAll().stream().map(this::toMedicine).collect(Collectors.toList());
    }

    public List<MedicineResponse> lowStock() {
        return medicineRepository.findAll().stream()
                .filter(m -> m.getStockQty() <= m.getReorderLevel())
                .map(this::toMedicine).collect(Collectors.toList());
    }

    @Transactional public MedicineResponse addMedicine(MedicineRequest req) {
        Medicine m = Medicine.builder().name(req.getName()).description(req.getDescription())
                .stockQty(req.getStockQty()).unitPrice(req.getUnitPrice())
                .reorderLevel(req.getReorderLevel() != null ? req.getReorderLevel() : 10).build();
        return toMedicine(medicineRepository.save(m));
    }

    public List<PrescriptionResponse> pendingPrescriptions() {
        return prescriptionRepository.findByStatusOrderByCreatedAtDesc(PrescriptionStatus.PENDING)
                .stream().map(this::toPrescription).collect(Collectors.toList());
    }

    public List<PrescriptionResponse> byPatient(Long patientId) {
        return prescriptionRepository.findByPatientIdOrderByCreatedAtDesc(patientId)
                .stream().map(this::toPrescription).collect(Collectors.toList());
    }

    @Transactional public PrescriptionResponse create(PrescriptionRequest req) {
        Prescription p = Prescription.builder().appointmentId(req.getAppointmentId())
                .doctorId(req.getDoctorId()).patientId(req.getPatientId())
                .status(PrescriptionStatus.PENDING).build();
        for (PrescriptionItemRequest item : req.getItems()) {
            PrescriptionItem pi = PrescriptionItem.builder().prescription(p)
                    .medicineId(item.getMedicineId()).dosage(item.getDosage())
                    .frequency(item.getFrequency()).durationDays(item.getDurationDays()).build();
            p.getItems().add(pi);
        }
        return toPrescription(prescriptionRepository.save(p));
    }

    @Transactional public PrescriptionResponse dispense(Long id) {
        Prescription p = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found"));
        if (p.getStatus() != PrescriptionStatus.PENDING) throw new BadRequestException("Already dispensed or cancelled");
        for (PrescriptionItem item : p.getItems()) {
            Medicine med = medicineRepository.findById(item.getMedicineId())
                    .orElseThrow(() -> new ResourceNotFoundException("Medicine not found: " + item.getMedicineId()));
            if (med.getStockQty() < 1) throw new BadRequestException("Insufficient stock for " + med.getName());
            med.setStockQty(med.getStockQty() - 1);
            medicineRepository.save(med);
        }
        p.setStatus(PrescriptionStatus.DISPENSED);
        return toPrescription(prescriptionRepository.save(p));
    }

    private MedicineResponse toMedicine(Medicine m) {
        MedicineResponse r = new MedicineResponse();
        r.setId(m.getId()); r.setName(m.getName()); r.setDescription(m.getDescription());
        r.setStockQty(m.getStockQty()); r.setUnitPrice(m.getUnitPrice()); r.setReorderLevel(m.getReorderLevel());
        return r;
    }

    private PrescriptionResponse toPrescription(Prescription p) {
        PrescriptionResponse r = new PrescriptionResponse();
        r.setId(p.getId()); r.setAppointmentId(p.getAppointmentId()); r.setDoctorId(p.getDoctorId());
        r.setPatientId(p.getPatientId()); r.setStatus(p.getStatus()); r.setCreatedAt(p.getCreatedAt());
        r.setItems(p.getItems().stream().map(i -> {
            PrescriptionItemResponse ir = new PrescriptionItemResponse();
            ir.setId(i.getId()); ir.setMedicineId(i.getMedicineId()); ir.setDosage(i.getDosage());
            ir.setFrequency(i.getFrequency()); ir.setDurationDays(i.getDurationDays());
            return ir;
        }).collect(Collectors.toList()));
        return r;
    }
}
