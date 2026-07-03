package com.medicore.doctor.controller;

import com.medicore.doctor.entity.Department;
import com.medicore.doctor.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/doctors/departments")
@RequiredArgsConstructor
public class DepartmentController {
    
    private final DepartmentRepository departmentRepository;

    @GetMapping
    public List<Department> getAllDepartments() {
        return departmentRepository.findAll();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Department createDepartment(@RequestBody Department department) {
        if (department.getIsActive() == null) department.setIsActive(true);
        return departmentRepository.save(department);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Department updateDepartment(@PathVariable Long id, @RequestBody Department department) {
        return departmentRepository.findById(id).map(existing -> {
            existing.setName(department.getName());
            existing.setDescription(department.getDescription());
            if (department.getIsActive() != null) {
                existing.setIsActive(department.getIsActive());
            }
            return departmentRepository.save(existing);
        }).orElseThrow(() -> new RuntimeException("Department not found"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteDepartment(@PathVariable Long id) {
        departmentRepository.deleteById(id);
    }
}
