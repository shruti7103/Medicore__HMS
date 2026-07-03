package com.medicore.patient.controller;

import com.medicore.common.dto.ApiResponse;
import com.medicore.patient.dto.PatientDtos.AnalyticsSummary;
import com.medicore.patient.service.AdminAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {
    private final AdminAnalyticsService adminAnalyticsService;

    @GetMapping("/analytics/summary")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<AnalyticsSummary> summary() {
        return ApiResponse.ok(adminAnalyticsService.getSummary());
    }
}
