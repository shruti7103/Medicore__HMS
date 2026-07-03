package com.medicore.billing.service;

import com.medicore.common.exception.BadRequestException;
import com.medicore.common.exception.ResourceNotFoundException;
import com.medicore.billing.dto.BillingDtos.*;
import com.medicore.billing.entity.*;
import com.medicore.billing.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor
public class BillingService {
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;

    public List<InvoiceResponse> listInvoices() {
        return invoiceRepository.findAll().stream().map(this::toInvoice).collect(Collectors.toList());
    }

    public InvoiceResponse findById(Long invoiceId) {
        return invoiceRepository.findById(invoiceId)
                .map(this::toInvoice)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found"));
    }

    public List<InvoiceResponse> byPatient(Long patientId) {
        return invoiceRepository.findByPatientIdOrderByIssuedAtDesc(patientId).stream().map(this::toInvoice).collect(Collectors.toList());
    }

    @Transactional public InvoiceResponse createInvoice(InvoiceRequest req) {
        if (invoiceRepository.findByAppointmentId(req.getAppointmentId()).isPresent())
            throw new BadRequestException("Invoice already exists for appointment");
        Invoice inv = Invoice.builder().appointmentId(req.getAppointmentId()).patientId(req.getPatientId())
                .amount(req.getAmount()).status(InvoiceStatus.UNPAID).dueDate(req.getDueDate()).build();
        return toInvoice(invoiceRepository.save(inv));
    }

    @Transactional public InvoiceResponse createForAppointment(Long appointmentId, InvoiceRequest req) {
        req.setAppointmentId(appointmentId);
        return createInvoice(req);
    }

    @Transactional public PaymentResponse pay(PayRequest req) {
        Invoice inv = invoiceRepository.findById(req.getInvoiceId())
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found"));
        if (inv.getStatus() == InvoiceStatus.PAID) throw new BadRequestException("Invoice already paid");
        Payment p = Payment.builder().invoiceId(inv.getId()).method(req.getMethod())
                .transactionRef(req.getTransactionRef()).amount(req.getAmount()).build();
        paymentRepository.save(p);
        inv.setStatus(InvoiceStatus.PAID);
        invoiceRepository.save(inv);
        return toPayment(p);
    }

    public long countInvoices() { return invoiceRepository.count(); }

    private InvoiceResponse toInvoice(Invoice i) {
        InvoiceResponse r = new InvoiceResponse();
        r.setId(i.getId()); r.setAppointmentId(i.getAppointmentId()); r.setPatientId(i.getPatientId());
        r.setAmount(i.getAmount()); r.setStatus(i.getStatus()); r.setIssuedAt(i.getIssuedAt()); r.setDueDate(i.getDueDate());
        return r;
    }

    private PaymentResponse toPayment(Payment p) {
        PaymentResponse r = new PaymentResponse();
        r.setId(p.getId()); r.setInvoiceId(p.getInvoiceId()); r.setMethod(p.getMethod());
        r.setTransactionRef(p.getTransactionRef()); r.setAmount(p.getAmount()); r.setPaidAt(p.getPaidAt());
        return r;
    }
}
