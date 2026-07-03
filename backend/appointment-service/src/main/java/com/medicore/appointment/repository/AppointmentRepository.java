package com.medicore.appointment.repository;
import com.medicore.appointment.entity.Appointment;
import com.medicore.appointment.entity.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByPatientIdOrderBySlotStartDesc(Long patientId);
    List<Appointment> findByDoctorIdOrderBySlotStartDesc(Long doctorId);
    List<Appointment> findByDoctorIdAndSlotStartBetween(Long doctorId, LocalDateTime start, LocalDateTime end);
    Optional<Appointment> findByDoctorIdAndSlotStart(Long doctorId, LocalDateTime slotStart);
    long count();
    long countByStatus(AppointmentStatus status);
}
