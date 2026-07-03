package com.medicore.billing.entity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity @Table(name="payments") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Payment {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="invoice_id",nullable=false) private Long invoiceId;
    @Enumerated(EnumType.STRING) @Column(nullable=false) private PaymentMethod method;
    @Column(name="transaction_ref") private String transactionRef;
    @Column(nullable=false) private BigDecimal amount;
    @Column(name="paid_at",insertable=false,updatable=false) private LocalDateTime paidAt;
}
