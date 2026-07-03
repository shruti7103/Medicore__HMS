package com.medicore.nurse.repository;
import com.medicore.nurse.entity.MedicationAdministration; import org.springframework.data.jpa.repository.JpaRepository;
public interface MedicationAdministrationRepository extends JpaRepository<MedicationAdministration,Long> {}
