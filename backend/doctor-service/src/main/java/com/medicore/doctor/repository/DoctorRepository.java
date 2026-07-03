package com.medicore.doctor.repository;
import com.medicore.doctor.entity.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    Optional<Doctor> findByUserId(Long userId);
    List<Doctor> findByIsActiveTrue();
    List<Doctor> findByDepartment(String department);
    long countByIsActiveTrue();
}
