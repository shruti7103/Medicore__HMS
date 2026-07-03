package com.medicore.notification.service;

import com.medicore.common.exception.ResourceNotFoundException;
import com.medicore.common.security.SecurityUtils;
import com.medicore.notification.dto.NotificationDtos.*;
import com.medicore.notification.entity.Notification;
import com.medicore.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public List<NotificationResponse> myNotifications() {
        Long userId = SecurityUtils.currentUserId();
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public long unreadCount() {
        return notificationRepository.countByUserIdAndIsReadFalse(SecurityUtils.currentUserId());
    }

    @Transactional public NotificationResponse create(CreateRequest req) {
        Notification n = Notification.builder().userId(req.getUserId()).type(req.getType())
                .title(req.getTitle()).message(req.getMessage()).isRead(false).build();
        Notification saved = notificationRepository.save(n);
        messagingTemplate.convertAndSend("/topic/user/" + req.getUserId(), toResponse(saved));
        return toResponse(saved);
    }

    @Transactional public NotificationResponse markRead(Long id) {
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        n.setIsRead(true);
        return toResponse(notificationRepository.save(n));
    }

    private NotificationResponse toResponse(Notification n) {
        NotificationResponse r = new NotificationResponse();
        r.setId(n.getId()); r.setUserId(n.getUserId()); r.setType(n.getType());
        r.setTitle(n.getTitle()); r.setMessage(n.getMessage()); r.setIsRead(n.getIsRead()); r.setCreatedAt(n.getCreatedAt());
        return r;
    }
}
