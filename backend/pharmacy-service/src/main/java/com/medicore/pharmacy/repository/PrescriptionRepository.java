package com.medicore.pharmacy.repository;
import com.medicore.pharmacy.entity.Prescription;
import com.medicore.pharmacy.entity.PrescriptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
    List<Prescription> findByStatusOrderByCreatedAtDesc(PrescriptionStatus status);
    List<Prescription> findByPatientIdOrderByCreatedAtDesc(Long patientId);
}
