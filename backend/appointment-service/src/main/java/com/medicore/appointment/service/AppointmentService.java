package com.medicore.appointment.service;

import com.medicore.common.exception.BadRequestException;
import com.medicore.common.exception.ResourceNotFoundException;
import com.medicore.common.model.Role;
import com.medicore.common.security.SecurityUtils;
import com.medicore.appointment.dto.AppointmentDtos.*;
import com.medicore.appointment.entity.*;
import com.medicore.appointment.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor
public class AppointmentService {
    private final AppointmentRepository appointmentRepository;

    public List<AppointmentResponse> findAll() {
        return appointmentRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    public AppointmentResponse findById(Long id) {
        return toResponse(get(id));
    }

    public List<AppointmentResponse> byPatient(Long patientId) {
        return appointmentRepository.findByPatientIdOrderBySlotStartDesc(patientId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<AppointmentResponse> byDoctor(Long doctorId) {
        return appointmentRepository.findByDoctorIdOrderBySlotStartDesc(doctorId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional public AppointmentResponse book(BookRequest req) {
        if (appointmentRepository.findByDoctorIdAndSlotStart(req.getDoctorId(), req.getSlotStart()).isPresent())
            throw new BadRequestException("Slot already booked");
            
        String link = null;
        if (Boolean.TRUE.equals(req.getIsVideoConsultation())) {
            link = "/telemedicine/" + java.util.UUID.randomUUID().toString();
        }
            
        Appointment a = Appointment.builder().patientId(req.getPatientId()).doctorId(req.getDoctorId())
                .slotStart(req.getSlotStart()).slotEnd(req.getSlotEnd()).reason(req.getReason())
                .telemedicineLink(link)
                .status(AppointmentStatus.PENDING).build();
        return toResponse(appointmentRepository.save(a));
    }

    @Transactional public AppointmentResponse updateStatus(Long id, StatusRequest req) {
        Appointment a = get(id);
        a.setStatus(req.getStatus());
        return toResponse(appointmentRepository.save(a));
    }

    @Transactional public AppointmentResponse reschedule(Long id, BookRequest req) {
        Appointment a = get(id);
        if (appointmentRepository.findByDoctorIdAndSlotStart(req.getDoctorId(), req.getSlotStart())
                .filter(existing -> !existing.getId().equals(id)).isPresent())
            throw new BadRequestException("Slot already booked");
        a.setDoctorId(req.getDoctorId()); a.setPatientId(req.getPatientId());
        a.setSlotStart(req.getSlotStart()); a.setSlotEnd(req.getSlotEnd()); a.setReason(req.getReason());
        return toResponse(appointmentRepository.save(a));
    }

    public long countAll() { return appointmentRepository.count(); }

    private Appointment get(Long id) {
        return appointmentRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));
    }

    private AppointmentResponse toResponse(Appointment a) {
        AppointmentResponse r = new AppointmentResponse();
        r.setId(a.getId()); r.setPatientId(a.getPatientId()); r.setDoctorId(a.getDoctorId());
        r.setSlotStart(a.getSlotStart()); r.setSlotEnd(a.getSlotEnd());
        r.setStatus(a.getStatus()); r.setReason(a.getReason());
        r.setTelemedicineLink(a.getTelemedicineLink());
        return r;
    }
}
