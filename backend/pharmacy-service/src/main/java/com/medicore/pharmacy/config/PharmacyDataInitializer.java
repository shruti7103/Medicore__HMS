package com.medicore.pharmacy.config;

import com.medicore.pharmacy.entity.Medicine;
import com.medicore.pharmacy.repository.MedicineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;

@Component @RequiredArgsConstructor
public class PharmacyDataInitializer implements CommandLineRunner {
    private final MedicineRepository medicineRepository;
    @Override @SuppressWarnings("null") public void run(String... args) {
        if (medicineRepository.count() == 0) {
            medicineRepository.save(Medicine.builder().name("Paracetamol 500mg").description("Pain reliever").stockQty(200).unitPrice(new BigDecimal("5.00")).reorderLevel(20).build());
            medicineRepository.save(Medicine.builder().name("Amoxicillin 250mg").description("Antibiotic").stockQty(150).unitPrice(new BigDecimal("12.50")).reorderLevel(15).build());
            medicineRepository.save(Medicine.builder().name("Ibuprofen 400mg").description("Anti-inflammatory").stockQty(8).unitPrice(new BigDecimal("8.00")).reorderLevel(10).build());
        }
    }
}
