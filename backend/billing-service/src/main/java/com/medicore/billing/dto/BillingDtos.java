package com.medicore.billing.dto;
import com.medicore.billing.entity.InvoiceStatus;
import com.medicore.billing.entity.PaymentMethod;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class BillingDtos {
    @Data public static class InvoiceRequest {
        @NotNull private Long appointmentId;
        @NotNull private Long patientId;
        @NotNull private BigDecimal amount;
        private LocalDate dueDate;
    }
    @Data public static class PayRequest {
        @NotNull private Long invoiceId;
        @NotNull private PaymentMethod method;
        private String transactionRef;
        @NotNull private BigDecimal amount;
    }
    @Data public static class InvoiceResponse {
        private Long id; private Long appointmentId; private Long patientId;
        private BigDecimal amount; private InvoiceStatus status;
        private LocalDateTime issuedAt; private LocalDate dueDate;
    }
    @Data public static class PaymentResponse {
        private Long id; private Long invoiceId; private PaymentMethod method;
        private String transactionRef; private BigDecimal amount; private LocalDateTime paidAt;
    }
}
