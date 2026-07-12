package com.medicore.pharmacy.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity @Table(name="prescriptions") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Prescription {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="appointment_id",nullable=false) private Long appointmentId;
    @Column(name="doctor_id",nullable=false) private Long doctorId;
    @Column(name="patient_id",nullable=false) private Long patientId;
    @Builder.Default
    @Enumerated(EnumType.STRING) @Column(nullable=false) private PrescriptionStatus status=PrescriptionStatus.PENDING;
    @Column(name="created_at",insertable=false,updatable=false) private LocalDateTime createdAt;
    @OneToMany(mappedBy="prescription", cascade=CascadeType.ALL, orphanRemoval=true)
    @Builder.Default private List<PrescriptionItem> items = new ArrayList<>();
}
