package com.medicore.auth.repository;

import com.medicore.auth.entity.RolePermission;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RolePermissionRepository extends JpaRepository<RolePermission, Long> {
    List<RolePermission> findByRole(String role);
    List<RolePermission> findByRoleAndIsEnabledTrue(String role);
    RolePermission findByRoleAndPermission(String role, String permission);
}
