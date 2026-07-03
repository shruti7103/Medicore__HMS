package com.medicore.nurse.dto;
import com.medicore.nurse.entity.*; import jakarta.validation.constraints.*; import lombok.Data;
import java.time.LocalDateTime; import java.util.List;
public class NurseDtos {
 @Data public static class VitalsRequest { @NotNull private Long patientId; private Integer bpSystolic; private Integer bpDiastolic; private Integer pulse; private java.math.BigDecimal temperatureC; private java.math.BigDecimal weightKg; }
 @Data public static class MedLogRequest { @NotNull private Long prescriptionItemId; @NotNull private Long patientId; private String notes; }
 @Data public static class EscalateRequest { @NotNull private Long patientId; @NotNull private Long doctorId; @NotBlank private String message; }
 @Data public static class TaskResponse { private Long id; private Long patientId; private String title; private TaskStatus status; private LocalDateTime dueAt; }
 @Data public static class AssignmentResponse { private Long id; private Long patientId; private Long nurseId; private Long assignedBy; private AssignmentStatus status; private String notes; }
 @Data public static class NurseResponse { private Long id; private Long userId; private String firstName; private String lastName; private String department; private String shiftPattern; private Boolean isActive; }
 @Data public static class AssignmentRequest { @NotNull private Long nurseId; @NotNull private Long patientId; @NotNull private Long assignedBy; private String notes; }
 @Data public static class TaskRequest { @NotNull private Long patientId; @NotNull private Long assignedNurseId; @NotNull private Long createdBy; @NotBlank private String title; private LocalDateTime dueAt; }
}
