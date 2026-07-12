package com.medicore.doctor.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalTime;

@Entity @Table(name="availability_slots") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AvailabilitySlot {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="doctor_id",nullable=false) private Long doctorId;
    @Enumerated(EnumType.STRING) @Column(name="day_of_week",nullable=false) private DayOfWeek dayOfWeek;
    @Column(name="start_time",nullable=false) private LocalTime startTime;
    @Column(name="end_time",nullable=false) private LocalTime endTime;
    @Builder.Default
    @Column(name="slot_duration_mins",nullable=false) private Integer slotDurationMins=30;
    @Builder.Default
    @Column(name="is_active",nullable=false) private Boolean isActive=true;
}
