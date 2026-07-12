package com.medicore.billing.controller;
import com.medicore.billing.repository.InvoiceRepository; import com.medicore.billing.repository.PaymentRepository;
import com.medicore.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor; import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal; import java.util.Map;
@RestController @RequestMapping("/internal") @RequiredArgsConstructor
public class InternalStatsController {
 private final InvoiceRepository invoiceRepository; private final PaymentRepository paymentRepository;
 @GetMapping("/stats") public ApiResponse<Map<String,Long>> stats(){ return ApiResponse.ok(Map.of("count",invoiceRepository.count())); }
 @SuppressWarnings("null")
 @GetMapping("/stats/revenue") public ApiResponse<Map<String,Long>> revenue(){
  BigDecimal sum=paymentRepository.findAll().stream().map(p->p.getAmount()).reduce(BigDecimal.ZERO,BigDecimal::add);
  return ApiResponse.ok(Map.of("count",sum.longValue())); }}
