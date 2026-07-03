package com.medicore.pharmacy.entity;
import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name="prescription_items") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PrescriptionItem {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="prescription_id",nullable=false) private Prescription prescription;
    @Column(name="medicine_id",nullable=false) private Long medicineId;
    @Column(nullable=false,length=80) private String dosage;
    @Column(nullable=false,length=80) private String frequency;
    @Column(name="duration_days",nullable=false) private Integer durationDays;
}
