package com.medicore.patient.repository;
import com.medicore.patient.entity.Vitals;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface VitalsRepository extends JpaRepository<Vitals, Long> {
    List<Vitals> findByPatientIdOrderByRecordedAtDesc(Long patientId);
}
