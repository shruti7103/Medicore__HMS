package com.medicore.nurse.entity;
import jakarta.persistence.*; import lombok.*; import java.time.LocalDateTime;
@Entity @Table(name="medication_administration") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MedicationAdministration {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(name="prescription_item_id",nullable=false) private Long prescriptionItemId;
 @Column(name="patient_id",nullable=false) private Long patientId;
 @Column(name="administered_by_nurse_id",nullable=false) private Long administeredByNurseId;
 @Column(name="administered_at",insertable=false,updatable=false) private LocalDateTime administeredAt;
 private String notes;
}
