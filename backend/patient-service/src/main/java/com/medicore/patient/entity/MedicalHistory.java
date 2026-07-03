package com.medicore.patient.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
@Entity @Table(name="medical_history") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MedicalHistory {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="patient_id",nullable=false) private Long patientId;
    @Column(name="doctor_id") private Long doctorId;
    @Column(name="visit_date",nullable=false) private LocalDate visitDate;
    private String diagnosis;
    private String notes;
    @Column(name="created_at",insertable=false,updatable=false) private LocalDateTime createdAt;
}
