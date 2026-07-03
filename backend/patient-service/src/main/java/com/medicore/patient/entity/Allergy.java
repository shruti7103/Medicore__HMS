package com.medicore.patient.entity;
import jakarta.persistence.*;
import lombok.*;
@Entity @Table(name="allergies") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Allergy {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="patient_id",nullable=false) private Long patientId;
    @Column(nullable=false,length=120) private String allergen;
    @Enumerated(EnumType.STRING) @Column(nullable=false) private Severity severity=Severity.MILD;
    private String notes;
}
