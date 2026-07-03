package com.medicore.notification.repository;

import com.medicore.notification.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    
    @Query("SELECT m FROM Message m WHERE (m.senderId = :user1 AND m.receiverId = :user2) OR (m.senderId = :user2 AND m.receiverId = :user1) ORDER BY m.createdAt ASC")
    List<Message> findConversation(@Param("user1") Long user1, @Param("user2") Long user2);
    
    @Query(value = "SELECT id, sender_id, receiver_id, sender_name, content, is_read, created_at " +
                   "FROM messages m1 WHERE created_at = (SELECT MAX(created_at) FROM messages m2 WHERE " +
                   "(m1.sender_id = m2.sender_id AND m1.receiver_id = m2.receiver_id) OR " +
                   "(m1.sender_id = m2.receiver_id AND m1.receiver_id = m2.sender_id)) " +
                   "AND (sender_id = :userId OR receiver_id = :userId) " +
                   "ORDER BY created_at DESC", nativeQuery = true)
    List<Message> findLatestThreads(@Param("userId") Long userId);
}
