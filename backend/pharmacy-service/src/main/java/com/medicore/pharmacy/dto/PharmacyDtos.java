package com.medicore.pharmacy.dto;
import com.medicore.pharmacy.entity.PrescriptionStatus;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class PharmacyDtos {
    @Data public static class MedicineRequest {
        @NotBlank private String name;
        private String description;
        @NotNull private Integer stockQty;
        @NotNull private BigDecimal unitPrice;
        private Integer reorderLevel;
    }
    @Data public static class MedicineResponse {
        private Long id; private String name; private String description;
        private Integer stockQty; private BigDecimal unitPrice; private Integer reorderLevel;
    }
    @Data public static class PrescriptionItemRequest {
        @NotNull private Long medicineId;
        @NotBlank private String dosage;
        @NotBlank private String frequency;
        @NotNull private Integer durationDays;
    }
    @Data public static class PrescriptionRequest {
        @NotNull private Long appointmentId;
        @NotNull private Long doctorId;
        @NotNull private Long patientId;
        @NotEmpty private List<PrescriptionItemRequest> items;
    }
    @Data public static class PrescriptionItemResponse {
        private Long id; private Long medicineId; private String dosage; private String frequency; private Integer durationDays;
    }
    @Data public static class PrescriptionResponse {
        private Long id; private Long appointmentId; private Long doctorId; private Long patientId;
        private PrescriptionStatus status; private LocalDateTime createdAt;
        private List<PrescriptionItemResponse> items;
    }
}
