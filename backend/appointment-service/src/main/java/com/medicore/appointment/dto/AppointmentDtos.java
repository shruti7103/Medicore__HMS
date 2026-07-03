package com.medicore.appointment.dto;
import com.medicore.appointment.entity.AppointmentStatus;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDateTime;

public class AppointmentDtos {
    @Data public static class BookRequest {
        @NotNull private Long patientId;
        @NotNull private Long doctorId;
        @NotNull private LocalDateTime slotStart;
        @NotNull private LocalDateTime slotEnd;
        private String reason;
        private Boolean isVideoConsultation;
    }
    @Data public static class StatusRequest {
        @NotNull private AppointmentStatus status;
    }
    @Data public static class AppointmentResponse {
        private Long id; private Long patientId; private Long doctorId;
        private LocalDateTime slotStart; private LocalDateTime slotEnd;
        private AppointmentStatus status; private String reason;
        private String telemedicineLink;
    }
}
