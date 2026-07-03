package com.medicore.doctor.dto;
import com.medicore.doctor.entity.DayOfWeek;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

public class DoctorDtos {
    @Data public static class DoctorRequest {
        @NotBlank private String firstName;
        @NotBlank private String lastName;
        @NotBlank private String specialization;
        @NotBlank private String department;
        private Integer experienceYears;
        private BigDecimal consultationFee;
        private String bio;
    }
    @Data public static class DoctorResponse {
        private Long id; private Long userId; private String firstName; private String lastName;
        private String specialization; private String department; private Integer experienceYears;
        private BigDecimal consultationFee; private String bio; private Boolean isActive;
    }
    @Data public static class SlotRequest {
        @NotNull private DayOfWeek dayOfWeek;
        @NotNull private LocalTime startTime;
        @NotNull private LocalTime endTime;
        private Integer slotDurationMins;
    }
    @Data public static class SlotResponse {
        private Long id; private DayOfWeek dayOfWeek;
        private LocalTime startTime; private LocalTime endTime; private Integer slotDurationMins;
    }
    @Data public static class OpenSlot {
        private LocalDateTime slotStart;
        private LocalDateTime slotEnd;
        private boolean available;
    }
}
