package com.medicore.pharmacy.entity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity @Table(name="medicines") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Medicine {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false,length=150) private String name;
    private String description;
    @Column(name="stock_qty",nullable=false) private Integer stockQty=0;
    @Column(name="unit_price",nullable=false) private BigDecimal unitPrice=BigDecimal.ZERO;
    @Column(name="reorder_level",nullable=false) private Integer reorderLevel=10;
    @Column(name="created_at",insertable=false,updatable=false) private LocalDateTime createdAt;
}
