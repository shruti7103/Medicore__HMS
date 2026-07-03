package com.medicore.notification.dto;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDateTime;

public class NotificationDtos {
    @Data public static class CreateRequest {
        @NotNull private Long userId;
        @NotBlank private String type;
        @NotBlank private String title;
        @NotBlank private String message;
    }
    @Data public static class NotificationResponse {
        private Long id; private Long userId; private String type;
        private String title; private String message; private Boolean isRead; private LocalDateTime createdAt;
    }
}
