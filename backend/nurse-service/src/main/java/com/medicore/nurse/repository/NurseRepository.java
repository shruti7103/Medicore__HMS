package com.medicore.nurse.repository;
import com.medicore.nurse.entity.Nurse; import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional; public interface NurseRepository extends JpaRepository<Nurse,Long> {
 Optional<Nurse> findByUserId(Long userId); }
