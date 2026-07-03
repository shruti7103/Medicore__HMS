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
    public TaskResponse completeTask(Long id) {
        NursingTask t = taskRepository.findById(id).orElseThrow();
        t.setStatus(TaskStatus.DONE);
        return toTask(taskRepository.save(t));
    }

    @Transactional
    public void logMedication(MedLogRequest req) {
        medLogRepository.save(MedicationAdministration.builder()
                .prescriptionItemId(req.getPrescriptionItemId())
                .patientId(req.getPatientId())
                .administeredByNurseId(me().getId())
                .notes(req.getNotes())
                .build());
    }

    private AssignmentResponse toAssign(PatientAssignment a) {
        AssignmentResponse r = new AssignmentResponse();
        r.setId(a.getId()); r.setPatientId(a.getPatientId());
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
