package com.medicore.patient.config;

import com.medicore.patient.entity.Gender;
import com.medicore.patient.entity.Patient;
import com.medicore.patient.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class PatientDataInitializer implements CommandLineRunner {

    private final PatientRepository patientRepository;

    @Override
    public void run(String... args) {
        if (patientRepository.count() > 0) return;

        patientRepository.save(Patient.builder()
                .userId(4L)
                .firstName("John")
                .lastName("Patient")
                .dob(LocalDate.of(1990, 5, 15))
                .gender(Gender.MALE)
                .bloodGroup("O+")
                .phone("9876543210")
                .address("123 Health Street")
                .emergencyContact("Emergency Contact")
                .build());
    }
}
