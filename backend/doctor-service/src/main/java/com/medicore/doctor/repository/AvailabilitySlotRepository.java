package com.medicore.doctor.repository;
import com.medicore.doctor.entity.AvailabilitySlot;
import com.medicore.doctor.entity.DayOfWeek;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface AvailabilitySlotRepository extends JpaRepository<AvailabilitySlot, Long> {
    List<AvailabilitySlot> findByDoctorIdAndIsActiveTrue(Long doctorId);
    List<AvailabilitySlot> findByDoctorIdAndDayOfWeekAndIsActiveTrue(Long doctorId, DayOfWeek dayOfWeek);
}
