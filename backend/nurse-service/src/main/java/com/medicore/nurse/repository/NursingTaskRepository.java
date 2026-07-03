package com.medicore.nurse.repository;
import com.medicore.nurse.entity.*; import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List; public interface NursingTaskRepository extends JpaRepository<NursingTask,Long> {
 List<NursingTask> findByAssignedNurseIdOrderByDueAtAsc(Long nurseId); }
