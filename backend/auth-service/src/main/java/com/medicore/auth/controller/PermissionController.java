package com.medicore.auth.controller;

import com.medicore.auth.entity.RolePermission;
import com.medicore.auth.repository.RolePermissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/auth/permissions")
@RequiredArgsConstructor
public class PermissionController {

    private final RolePermissionRepository rolePermissionRepository;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<RolePermission> getPermissions(@RequestParam(required = false) String role) {
        if (role != null) {
            return rolePermissionRepository.findByRole(role);
        }
        return rolePermissionRepository.findAll();
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public RolePermission updatePermission(@RequestBody RolePermission request) {
        RolePermission existing = rolePermissionRepository.findByRoleAndPermission(request.getRole(), request.getPermission());
        if (existing != null) {
            existing.setIsEnabled(request.getIsEnabled());
            return rolePermissionRepository.save(existing);
        } else {
            return rolePermissionRepository.save(request);
        }
    }
}
