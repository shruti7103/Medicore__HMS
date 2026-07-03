package com.medicore.nurse.entity;
import jakarta.persistence.*; import lombok.*; import java.time.LocalDateTime;
@Entity @Table(name="nursing_tasks") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NursingTask {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(name="patient_id",nullable=false) private Long patientId;
 @Column(name="assigned_nurse_id",nullable=false) private Long assignedNurseId;
 @Column(name="created_by",nullable=false) private Long createdBy;
 @Column(nullable=false) private String title;
 @Enumerated(EnumType.STRING) @Column(nullable=false) private TaskStatus status=TaskStatus.TODO;
 @Column(name="due_at") private LocalDateTime dueAt;
 @Column(name="created_at",insertable=false,updatable=false) private LocalDateTime createdAt;
}
