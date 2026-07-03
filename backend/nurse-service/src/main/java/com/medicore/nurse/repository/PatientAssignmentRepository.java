package com.medicore.nurse.repository;
import com.medicore.nurse.entity.*; import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List; public interface PatientAssignmentRepository extends JpaRepository<PatientAssignment,Long> {
 List<PatientAssignment> findByNurseIdAndStatus(Long nurseId, AssignmentStatus status); }
