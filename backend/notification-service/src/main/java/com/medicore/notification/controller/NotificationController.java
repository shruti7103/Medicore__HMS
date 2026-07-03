package com.medicore.notification.controller;

import com.medicore.common.dto.ApiResponse;
import com.medicore.notification.dto.NotificationDtos.*;
import com.medicore.notification.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController @RequestMapping("/notifications") @RequiredArgsConstructor
public class NotificationController {
    private final NotificationService notificationService;

    @GetMapping @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<NotificationResponse>> list() { return ApiResponse.ok(notificationService.myNotifications()); }

    @GetMapping("/unread-count") @PreAuthorize("isAuthenticated()")
    public ApiResponse<Map<String, Long>> unread() { return ApiResponse.ok(Map.of("count", notificationService.unreadCount())); }

    @PostMapping @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST','DOCTOR')")
    public ApiResponse<NotificationResponse> create(@Valid @RequestBody CreateRequest req) { return ApiResponse.ok(notificationService.create(req)); }

    @PatchMapping("/{id}/read") @PreAuthorize("isAuthenticated()")
    public ApiResponse<NotificationResponse> markRead(@PathVariable Long id) { return ApiResponse.ok(notificationService.markRead(id)); }
}
