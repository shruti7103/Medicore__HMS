package com.medicore.patient.service;
import com.medicore.common.exception.BadRequestException;
import com.medicore.common.exception.ResourceNotFoundException;
import com.medicore.common.model.Role;
import com.medicore.common.security.SecurityUtils;
import com.medicore.patient.dto.PatientDtos.*;
import com.medicore.patient.entity.*;
import com.medicore.patient.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor
public class PatientService {
    private final PatientRepository patientRepository;
    private final MedicalHistoryRepository historyRepository;
    private final VitalsRepository vitalsRepository;
    private final AllergyRepository allergyRepository;

    public List<PatientResponse> findAll() {
        return patientRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    public PatientResponse findById(Long id) {
        return toResponse(getPatient(id));
    }

    public PatientResponse me() {
        Long userId = SecurityUtils.currentUserId();
        Patient p = patientRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));
        return toDetailResponse(p);
    }

    @Transactional public PatientResponse create(PatientRequest req) {
        Long userId = SecurityUtils.currentUserId();
        if (patientRepository.findByUserId(userId).isPresent())
            throw new BadRequestException("Patient profile already exists");
        Patient p = Patient.builder().userId(userId).firstName(req.getFirstName()).lastName(req.getLastName())
                .dob(req.getDob()).gender(req.getGender()).bloodGroup(req.getBloodGroup())
                .phone(req.getPhone()).address(req.getAddress()).emergencyContact(req.getEmergencyContact()).build();
        return toResponse(patientRepository.save(p));
    }

    @Transactional public PatientResponse update(Long id, PatientRequest req) {
        Patient p = getPatient(id);
        checkAccess(p);
        p.setFirstName(req.getFirstName()); p.setLastName(req.getLastName());
        p.setDob(req.getDob()); p.setGender(req.getGender()); p.setBloodGroup(req.getBloodGroup());
        p.setPhone(req.getPhone()); p.setAddress(req.getAddress()); p.setEmergencyContact(req.getEmergencyContact());
        return toResponse(patientRepository.save(p));
    }

    @Transactional public void delete(Long id) {
        if (!SecurityUtils.hasRole(Role.ADMIN)) throw new BadRequestException("Only admin can delete");
        patientRepository.delete(getPatient(id));
    }

    @Transactional public MedicalHistoryResponse addHistory(Long id, MedicalHistoryRequest req) {
        getPatient(id);
        MedicalHistory h = MedicalHistory.builder().patientId(id).doctorId(req.getDoctorId())
                .visitDate(req.getVisitDate()).diagnosis(req.getDiagnosis()).notes(req.getNotes()).build();
        return toHistoryResponse(historyRepository.save(h));
    }

    @Transactional public VitalsResponse addVitals(Long id, VitalsRequest req) {
        getPatient(id);
        Vitals v = Vitals.builder().patientId(id).bpSystolic(req.getBpSystolic()).bpDiastolic(req.getBpDiastolic())
                .pulse(req.getPulse()).temperatureC(req.getTemperatureC()).weightKg(req.getWeightKg()).build();
        return toVitalsResponse(vitalsRepository.save(v));
    }

    @Transactional public AllergyResponse addAllergy(Long id, AllergyRequest req) {
        getPatient(id);
        Allergy a = Allergy.builder().patientId(id).allergen(req.getAllergen())
                .severity(req.getSeverity() != null ? req.getSeverity() : Severity.MILD).notes(req.getNotes()).build();
        return toAllergyResponse(allergyRepository.save(a));
    }

    public long countPatients() { return patientRepository.count(); }

    private Patient getPatient(Long id) {
        return patientRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
    }

    private void checkAccess(Patient p) {
        Role role = SecurityUtils.currentRole();
        if (role == Role.PATIENT && !p.getUserId().equals(SecurityUtils.currentUserId()))
            throw new BadRequestException("Access denied");
    }

    private PatientResponse toResponse(Patient p) {
        PatientResponse r = new PatientResponse();
        r.setId(p.getId()); r.setUserId(p.getUserId()); r.setFirstName(p.getFirstName()); r.setLastName(p.getLastName());
        r.setDob(p.getDob()); r.setGender(p.getGender()); r.setBloodGroup(p.getBloodGroup());
        r.setPhone(p.getPhone()); r.setAddress(p.getAddress()); r.setEmergencyContact(p.getEmergencyContact());
        return r;
    }

    private PatientResponse toDetailResponse(Patient p) {
        PatientResponse r = toResponse(p);
        r.setHistory(historyRepository.findByPatientIdOrderByVisitDateDesc(p.getId()).stream().map(this::toHistoryResponse).collect(Collectors.toList()));
        r.setVitals(vitalsRepository.findByPatientIdOrderByRecordedAtDesc(p.getId()).stream().map(this::toVitalsResponse).collect(Collectors.toList()));
        r.setAllergies(allergyRepository.findByPatientId(p.getId()).stream().map(this::toAllergyResponse).collect(Collectors.toList()));
        return r;
    }

    private MedicalHistoryResponse toHistoryResponse(MedicalHistory h) {
        MedicalHistoryResponse r = new MedicalHistoryResponse();
        r.setId(h.getId()); r.setPatientId(h.getPatientId()); r.setDoctorId(h.getDoctorId());
        r.setVisitDate(h.getVisitDate()); r.setDiagnosis(h.getDiagnosis()); r.setNotes(h.getNotes());
        return r;
    }

    private VitalsResponse toVitalsResponse(Vitals v) {
        VitalsResponse r = new VitalsResponse();
        r.setId(v.getId()); r.setBpSystolic(v.getBpSystolic()); r.setBpDiastolic(v.getBpDiastolic());
        r.setPulse(v.getPulse()); r.setTemperatureC(v.getTemperatureC()); r.setWeightKg(v.getWeightKg());
        return r;
    }

    private AllergyResponse toAllergyResponse(Allergy a) {
        AllergyResponse r = new AllergyResponse();
        r.setId(a.getId()); r.setAllergen(a.getAllergen()); r.setSeverity(a.getSeverity()); r.setNotes(a.getNotes());
        return r;
    }
}
