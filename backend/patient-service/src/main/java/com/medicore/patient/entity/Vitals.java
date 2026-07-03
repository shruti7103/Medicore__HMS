package com.medicore.patient.entity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
@Entity @Table(name="vitals") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Vitals {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="patient_id",nullable=false) private Long patientId;
    @Column(name="recorded_at",insertable=false,updatable=false) private LocalDateTime recordedAt;
    @Column(name="bp_systolic") private Integer bpSystolic;
    @Column(name="bp_diastolic") private Integer bpDiastolic;
    private Integer pulse;
    @Column(name="temperature_c") private BigDecimal temperatureC;
    @Column(name="weight_kg") private BigDecimal weightKg;
}
