package com.medicore.patient.dto;
import com.medicore.patient.entity.*;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
public class PatientDtos {
    @Data public static class PatientRequest {
        @NotBlank private String firstName;
        @NotBlank private String lastName;
        private LocalDate dob;
        private Gender gender;
        private String bloodGroup;
        private String phone;
        private String address;
        private String emergencyContact;
    }
    @Data public static class PatientResponse {
        private Long id; private Long userId; private String firstName; private String lastName;
        private LocalDate dob; private Gender gender; private String bloodGroup;
        private String phone; private String address; private String emergencyContact;
        private List<MedicalHistoryResponse> history;
        private List<VitalsResponse> vitals;
        private List<AllergyResponse> allergies;
    }
    @Data public static class MedicalHistoryRequest {
        @NotNull private LocalDate visitDate;
        private Long doctorId;
        private String diagnosis;
        private String notes;
    }
    @Data public static class MedicalHistoryResponse {
        private Long id; private Long patientId; private Long doctorId;
        private LocalDate visitDate; private String diagnosis; private String notes;
    }
    @Data public static class VitalsRequest {
        private Integer bpSystolic; private Integer bpDiastolic;
        private Integer pulse; private BigDecimal temperatureC; private BigDecimal weightKg;
    }
    @Data public static class VitalsResponse {
        private Long id; private Integer bpSystolic; private Integer bpDiastolic;
        private Integer pulse; private BigDecimal temperatureC; private BigDecimal weightKg;
    }
    @Data public static class AllergyRequest {
        @NotBlank private String allergen;
        private Severity severity;
        private String notes;
    }
    @Data public static class AllergyResponse {
        private Long id; private String allergen; private Severity severity; private String notes;
    }
    @Data public static class AnalyticsSummary {
        private long totalPatients;
        private long totalDoctors;
        private long totalAppointments;
        private long totalInvoices;
    }
}
