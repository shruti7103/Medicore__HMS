package com.medicore.notification.controller;

import com.medicore.common.security.SecurityUtils;
import com.medicore.notification.entity.Message;
import com.medicore.notification.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/notifications/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageRepository messageRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @PostMapping
    public Message sendMessage(@RequestBody Message message) {
        message.setSenderId(SecurityUtils.currentUserId());
        Message saved = messageRepository.save(message);
        
        messagingTemplate.convertAndSend("/topic/messages/" + saved.getReceiverId(), saved);
        
        return saved;
    }

    @GetMapping("/history")
    public List<Message> getHistory(@RequestParam Long otherUserId) {
        return messageRepository.findConversation(SecurityUtils.currentUserId(), otherUserId);
    }

    @GetMapping("/threads")
    public List<Message> getThreads() {
        return messageRepository.findLatestThreads(SecurityUtils.currentUserId());
    }
}
