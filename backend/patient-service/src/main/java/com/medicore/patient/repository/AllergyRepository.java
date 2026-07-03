package com.medicore.patient.repository;
import com.medicore.patient.entity.Allergy;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface AllergyRepository extends JpaRepository<Allergy, Long> {
    List<Allergy> findByPatientId(Long patientId);
}
