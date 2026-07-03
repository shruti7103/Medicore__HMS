package com.medicore.nurse.controller;
import com.medicore.common.dto.ApiResponse;
import com.medicore.nurse.repository.NurseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
@RestController @RequestMapping("/internal") @RequiredArgsConstructor
public class InternalStatsController {
 private final NurseRepository repository;
 @GetMapping("/stats") public ApiResponse<Map<String,Long>> stats() { return ApiResponse.ok(Map.of("count", repository.count())); }

}
