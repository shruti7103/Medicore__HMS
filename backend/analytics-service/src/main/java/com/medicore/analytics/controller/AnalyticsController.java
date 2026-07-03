package com.medicore.analytics.controller;
import com.medicore.analytics.dto.AnalyticsDtos.Summary;
import com.medicore.analytics.service.AnalyticsService;
import com.medicore.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/analytics") @RequiredArgsConstructor
public class AnalyticsController {
 private final AnalyticsService analyticsService;
 @GetMapping("/summary") @PreAuthorize("hasRole('ADMIN')") public ApiResponse<Summary> summary(){ return ApiResponse.ok(analyticsService.summary()); }
}
