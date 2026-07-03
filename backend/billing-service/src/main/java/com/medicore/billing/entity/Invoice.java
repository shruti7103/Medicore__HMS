package com.medicore.billing.entity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity @Table(name="invoices") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Invoice {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="appointment_id",nullable=false) private Long appointmentId;
    @Column(name="patient_id",nullable=false) private Long patientId;
    @Column(nullable=false) private BigDecimal amount;
    @Enumerated(EnumType.STRING) @Column(nullable=false) private InvoiceStatus status=InvoiceStatus.UNPAID;
    @Column(name="issued_at",insertable=false,updatable=false) private LocalDateTime issuedAt;
    @Column(name="due_date") private LocalDate dueDate;
}
