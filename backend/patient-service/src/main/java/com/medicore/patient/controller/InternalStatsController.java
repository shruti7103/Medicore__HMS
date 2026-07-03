package com.medicore.patient.controller;
import com.medicore.common.dto.ApiResponse;
import com.medicore.patient.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
@RestController @RequestMapping("/internal") @RequiredArgsConstructor
public class InternalStatsController {
 private final PatientRepository repository;
 @GetMapping("/stats") public ApiResponse<Map<String,Long>> stats() { return ApiResponse.ok(Map.of("count", repository.count())); }

}
