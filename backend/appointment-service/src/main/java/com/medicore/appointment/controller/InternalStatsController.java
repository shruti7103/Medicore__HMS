package com.medicore.appointment.controller;
import com.medicore.appointment.repository.AppointmentRepository;
import com.medicore.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate; import java.time.LocalDateTime; import java.util.Map;
@RestController @RequestMapping("/internal") @RequiredArgsConstructor
public class InternalStatsController {
 private final AppointmentRepository repository;
 @GetMapping("/stats") public ApiResponse<Map<String,Long>> stats(){ return ApiResponse.ok(Map.of("count",repository.count())); }
 @GetMapping("/stats/today") public ApiResponse<Map<String,Long>> today(){
  LocalDateTime s=LocalDate.now().atStartOfDay(), e=s.plusDays(1);
  return ApiResponse.ok(Map.of("count",repository.findAll().stream().filter(a->a.getSlotStart().isAfter(s)&&a.getSlotStart().isBefore(e)).count()));
 }}
