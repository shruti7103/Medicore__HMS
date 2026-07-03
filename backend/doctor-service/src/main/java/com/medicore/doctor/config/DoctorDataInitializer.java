package com.medicore.doctor.config;

import com.medicore.doctor.entity.AvailabilitySlot;
import com.medicore.doctor.entity.DayOfWeek;
import com.medicore.doctor.entity.Doctor;
import com.medicore.doctor.repository.AvailabilitySlotRepository;
import com.medicore.doctor.repository.DoctorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalTime;

@Component
@RequiredArgsConstructor
public class DoctorDataInitializer implements CommandLineRunner {

    private final DoctorRepository doctorRepository;
    private final AvailabilitySlotRepository slotRepository;

    @Override
    public void run(String... args) {
        if (doctorRepository.count() > 0) return;

        Doctor doctor = doctorRepository.save(Doctor.builder()
                .userId(2L)
                .firstName("Sarah")
                .lastName("Patel")
                .specialization("General Medicine")
                .department("General")
                .experienceYears(10)
                .consultationFee(new BigDecimal("500.00"))
                .bio("Experienced general physician")
                .isActive(true)
                .build());

        for (DayOfWeek day : DayOfWeek.values()) {
            if (day == DayOfWeek.SUN) continue;
            slotRepository.save(AvailabilitySlot.builder()
                    .doctorId(doctor.getId())
                    .dayOfWeek(day)
                    .startTime(LocalTime.of(9, 0))
                    .endTime(LocalTime.of(17, 0))
                    .slotDurationMins(30)
                    .isActive(true)
                    .build());
        }
    }
}
