package com.medicore.nurse.service;

import com.medicore.common.exception.ResourceNotFoundException;
import com.medicore.common.security.SecurityUtils;
import com.medicore.nurse.dto.NurseDtos.*;
import com.medicore.nurse.entity.*;
import com.medicore.nurse.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NurseService {
    private final NurseRepository nurseRepository;
    private final PatientAssignmentRepository assignmentRepository;
    private final NursingTaskRepository taskRepository;
    private final MedicationAdministrationRepository medLogRepository;

    private Nurse me() {
        return nurseRepository.findByUserId(SecurityUtils.currentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Nurse profile not found"));
    }

    public List<AssignmentResponse> assignments() {
        return assignmentRepository.findByNurseIdAndStatus(me().getId(), AssignmentStatus.ACTIVE)
                .stream().map(this::toAssign).collect(Collectors.toList());
    }

    public List<TaskResponse> tasks() {
        return taskRepository.findByAssignedNurseIdOrderByDueAtAsc(me().getId())
                .stream().map(this::toTask).collect(Collectors.toList());
    }

    @Transactional
    @SuppressWarnings("null")
    public TaskResponse completeTask(Long id) {
        NursingTask t = taskRepository.findById(id).orElseThrow();
        t.setStatus(TaskStatus.DONE);
        return toTask(taskRepository.save(t));
    }

    @Transactional
    @SuppressWarnings("null")
    public void logMedication(MedLogRequest req) {
        medLogRepository.save(MedicationAdministration.builder()
                .prescriptionItemId(req.getPrescriptionItemId())
                .patientId(req.getPatientId())
                .administeredByNurseId(me().getId())
                .notes(req.getNotes())
                .build());
    }

    public List<NurseResponse> findAllNurses() {
        return nurseRepository.findAll().stream().map(this::toNurseResponse).collect(Collectors.toList());
    }

    public List<AssignmentResponse> findAllAssignments() {
        return assignmentRepository.findAll().stream().map(this::toAssign).collect(Collectors.toList());
    }

    @Transactional
    @SuppressWarnings("null")
    public AssignmentResponse assignPatient(AssignmentRequest req) {
        PatientAssignment a = PatientAssignment.builder()
                .nurseId(req.getNurseId())
                .patientId(req.getPatientId())
                .assignedBy(req.getAssignedBy())
                .status(AssignmentStatus.ACTIVE)
                .notes(req.getNotes())
                .build();
        return toAssign(assignmentRepository.save(a));
    }

    @Transactional
    @SuppressWarnings("null")
    public TaskResponse createTask(TaskRequest req) {
        NursingTask t = NursingTask.builder()
                .patientId(req.getPatientId())
                .assignedNurseId(req.getAssignedNurseId())
                .createdBy(req.getCreatedBy())
                .title(req.getTitle())
                .status(TaskStatus.TODO)
                .dueAt(req.getDueAt())
                .build();
        return toTask(taskRepository.save(t));
    }

    public NurseResponse getNurseProfile() {
        return toNurseResponse(me());
    }

    @Transactional
    @SuppressWarnings("null")
    public NurseResponse createNurse(NurseRequest req) {
        Long userId = SecurityUtils.currentUserId();
        if (nurseRepository.findByUserId(userId).isPresent()) {
            throw new com.medicore.common.exception.BadRequestException("Nurse profile already exists");
        }
        Nurse n = Nurse.builder()
                .userId(userId)
                .firstName(req.getFirstName())
                .lastName(req.getLastName())
                .department(req.getDepartment())
                .shiftPattern(req.getShiftPattern() != null ? req.getShiftPattern() : "Day")
                .isActive(true)
                .build();
        return toNurseResponse(nurseRepository.save(n));
    }

    private NurseResponse toNurseResponse(Nurse n) {
        NurseResponse r = new NurseResponse();
        r.setId(n.getId()); r.setUserId(n.getUserId()); r.setFirstName(n.getFirstName());
        r.setLastName(n.getLastName()); r.setDepartment(n.getDepartment());
        r.setShiftPattern(n.getShiftPattern()); r.setIsActive(n.getIsActive());
        return r;
    }

    private AssignmentResponse toAssign(PatientAssignment a) {
        AssignmentResponse r = new AssignmentResponse();
        r.setId(a.getId()); r.setPatientId(a.getPatientId());
        r.setNurseId(a.getNurseId()); r.setAssignedBy(a.getAssignedBy());
        r.setStatus(a.getStatus()); r.setNotes(a.getNotes());
        return r;
    }

    private TaskResponse toTask(NursingTask t) {
        TaskResponse r = new TaskResponse();
        r.setId(t.getId()); r.setPatientId(t.getPatientId());
        r.setTitle(t.getTitle()); r.setStatus(t.getStatus()); r.setDueAt(t.getDueAt());
        return r;
    }
}
