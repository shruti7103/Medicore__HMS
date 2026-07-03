package com.medicore.doctor.service;

import com.medicore.common.exception.BadRequestException;
import com.medicore.common.exception.ResourceNotFoundException;
import com.medicore.common.model.Role;
import com.medicore.common.security.SecurityUtils;
import com.medicore.doctor.dto.DoctorDtos.*;
import com.medicore.doctor.entity.*;
import com.medicore.doctor.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor
public class DoctorService {
    private final DoctorRepository doctorRepository;
    private final AvailabilitySlotRepository slotRepository;

    public List<DoctorResponse> findAll() {
        return doctorRepository.findByIsActiveTrue().stream().map(this::toResponse).collect(Collectors.toList());
    }

    public DoctorResponse findById(Long id) {
        return toResponse(getDoctor(id));
    }

    public DoctorResponse me() {
        return doctorRepository.findByUserId(SecurityUtils.currentUserId())
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));
    }

    @Transactional public DoctorResponse create(DoctorRequest req) {
        Long userId = SecurityUtils.currentUserId();
        if (doctorRepository.findByUserId(userId).isPresent())
            throw new BadRequestException("Doctor profile already exists");
        Doctor d = Doctor.builder().userId(userId).firstName(req.getFirstName()).lastName(req.getLastName())
                .specialization(req.getSpecialization()).department(req.getDepartment())
                .experienceYears(req.getExperienceYears() != null ? req.getExperienceYears() : 0)
                .consultationFee(req.getConsultationFee() != null ? req.getConsultationFee() : java.math.BigDecimal.ZERO)
                .bio(req.getBio()).isActive(true).build();
        return toResponse(doctorRepository.save(d));
    }

    @Transactional public DoctorResponse update(Long id, DoctorRequest req) {
        Doctor d = getDoctor(id);
        d.setFirstName(req.getFirstName()); d.setLastName(req.getLastName());
        d.setSpecialization(req.getSpecialization()); d.setDepartment(req.getDepartment());
        if (req.getExperienceYears() != null) d.setExperienceYears(req.getExperienceYears());
        if (req.getConsultationFee() != null) d.setConsultationFee(req.getConsultationFee());
        d.setBio(req.getBio());
        return toResponse(doctorRepository.save(d));
    }

    @Transactional public SlotResponse addSlot(Long doctorId, SlotRequest req) {
        getDoctor(doctorId);
        AvailabilitySlot slot = AvailabilitySlot.builder().doctorId(doctorId).dayOfWeek(req.getDayOfWeek())
                .startTime(req.getStartTime()).endTime(req.getEndTime())
                .slotDurationMins(req.getSlotDurationMins() != null ? req.getSlotDurationMins() : 30).isActive(true).build();
        return toSlotResponse(slotRepository.save(slot));
    }

    public List<SlotResponse> listSlots(Long doctorId) {
        return slotRepository.findByDoctorIdAndIsActiveTrue(doctorId).stream().map(this::toSlotResponse).collect(Collectors.toList());
    }

    public List<OpenSlot> openSlots(Long doctorId, LocalDate date) {
        getDoctor(doctorId);
        com.medicore.doctor.entity.DayOfWeek dow = com.medicore.doctor.entity.DayOfWeek.valueOf(date.getDayOfWeek().name().substring(0, 3));
        List<AvailabilitySlot> templates = slotRepository.findByDoctorIdAndDayOfWeekAndIsActiveTrue(doctorId, dow);
        List<OpenSlot> result = new ArrayList<>();
        for (AvailabilitySlot t : templates) {
            LocalDateTime cursor = LocalDateTime.of(date, t.getStartTime());
            LocalDateTime end = LocalDateTime.of(date, t.getEndTime());
            int mins = t.getSlotDurationMins();
            while (cursor.plusMinutes(mins).compareTo(end) <= 0) {
                OpenSlot os = new OpenSlot();
                os.setSlotStart(cursor);
                os.setSlotEnd(cursor.plusMinutes(mins));
                os.setAvailable(true);
                result.add(os);
                cursor = cursor.plusMinutes(mins);
            }
        }
        return result;
    }

    public long countActiveDoctors() { return doctorRepository.countByIsActiveTrue(); }

    private Doctor getDoctor(Long id) {
        return doctorRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));
    }

    private DoctorResponse toResponse(Doctor d) {
        DoctorResponse r = new DoctorResponse();
        r.setId(d.getId()); r.setUserId(d.getUserId()); r.setFirstName(d.getFirstName()); r.setLastName(d.getLastName());
        r.setSpecialization(d.getSpecialization()); r.setDepartment(d.getDepartment());
        r.setExperienceYears(d.getExperienceYears()); r.setConsultationFee(d.getConsultationFee());
        r.setBio(d.getBio()); r.setIsActive(d.getIsActive());
        return r;
    }

    private SlotResponse toSlotResponse(AvailabilitySlot s) {
        SlotResponse r = new SlotResponse();
        r.setId(s.getId()); r.setDayOfWeek(s.getDayOfWeek());
        r.setStartTime(s.getStartTime()); r.setEndTime(s.getEndTime()); r.setSlotDurationMins(s.getSlotDurationMins());
        return r;
    }
}
