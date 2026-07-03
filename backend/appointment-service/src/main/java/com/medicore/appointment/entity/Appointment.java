package com.medicore.appointment.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name="appointments") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Appointment {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="patient_id",nullable=false) private Long patientId;
    @Column(name="doctor_id",nullable=false) private Long doctorId;
    @Column(name="slot_start",nullable=false) private LocalDateTime slotStart;
    @Column(name="slot_end",nullable=false) private LocalDateTime slotEnd;
    @Builder.Default @Enumerated(EnumType.STRING) @Column(nullable=false) private AppointmentStatus status=AppointmentStatus.PENDING;
    private String reason;
    @Column(name="telemedicine_link") private String telemedicineLink;
    @Column(name="created_at",insertable=false,updatable=false) private LocalDateTime createdAt;
    @Column(name="updated_at",insertable=false,updatable=false) private LocalDateTime updatedAt;
}
