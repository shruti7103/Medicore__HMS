package com.medicore.nurse.config;
import com.medicore.nurse.entity.*; import com.medicore.nurse.repository.*;
import lombok.RequiredArgsConstructor; import org.springframework.boot.CommandLineRunner; import org.springframework.stereotype.Component;
@Component @RequiredArgsConstructor
public class NurseDataInitializer implements CommandLineRunner {
 private final NurseRepository nurseRepository; private final NursingTaskRepository taskRepository;
 @Override @SuppressWarnings("null") public void run(String... args) {
  if(nurseRepository.count()>0) return;
  Nurse n=nurseRepository.save(Nurse.builder().userId(6L).firstName("Priya").lastName("Sharma").department("General").shiftPattern("Day").isActive(true).build());
  taskRepository.save(NursingTask.builder().patientId(1L).assignedNurseId(n.getId()).createdBy(2L).title("Check vitals - Room 4B").status(TaskStatus.TODO).build());
 }}
