package com.medicore.billing.controller;

import com.medicore.common.dto.ApiResponse;
import com.medicore.billing.dto.BillingDtos.*;
import com.medicore.billing.service.BillingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

import com.medicore.billing.service.PdfInvoiceService;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

@RestController @RequestMapping("/billing") @RequiredArgsConstructor
public class BillingController {
    private final BillingService billingService;
    private final PdfInvoiceService pdfInvoiceService;

    @GetMapping("/invoices") @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST','PATIENT')")
    public ApiResponse<List<InvoiceResponse>> list() { return ApiResponse.ok(billingService.listInvoices()); }

    @GetMapping("/invoices/patient/{patientId}") @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST','PATIENT')")
    public ApiResponse<List<InvoiceResponse>> byPatient(@PathVariable Long patientId) { return ApiResponse.ok(billingService.byPatient(patientId)); }

    @PostMapping("/invoices") @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST')")
    public ApiResponse<InvoiceResponse> create(@Valid @RequestBody InvoiceRequest req) { return ApiResponse.ok(billingService.createInvoice(req)); }

    @PostMapping("/invoices/{appointmentId}") @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST')")
    public ApiResponse<InvoiceResponse> createForAppt(@PathVariable Long appointmentId, @Valid @RequestBody InvoiceRequest req) {
        return ApiResponse.ok(billingService.createForAppointment(appointmentId, req));
    }

    @PostMapping("/pay") @PreAuthorize("hasAnyRole('PATIENT','RECEPTIONIST','ADMIN')")
    public ApiResponse<PaymentResponse> pay(@Valid @RequestBody PayRequest req) { return ApiResponse.ok(billingService.pay(req)); }

    @GetMapping("/invoices/{id}/pdf")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST','PATIENT')")
    public ResponseEntity<Resource> getInvoicePdf(@PathVariable Long id) {
        InvoiceResponse invoice = billingService.findById(id);
        byte[] pdfBytes = pdfInvoiceService.generateInvoicePdf(invoice);
        ByteArrayResource resource = new ByteArrayResource(pdfBytes);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"invoice_" + id + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .contentLength(pdfBytes.length)
                .body(resource);
    }
}
