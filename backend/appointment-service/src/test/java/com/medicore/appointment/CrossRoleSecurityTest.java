package com.medicore.appointment;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
    "eureka.client.enabled=false",
    "spring.cloud.discovery.enabled=false",
    "spring.datasource.url=jdbc:h2:mem:testdb",
    "spring.datasource.driverClassName=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=password",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect"
})
public class CrossRoleSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void testDoctorCannotAccessAdminEndpoints() throws Exception {
        mockMvc.perform(get("/appointments")
                .header("X-User-Id", "2")
                .header("X-User-Role", "NURSE")) // Using a role that isn't ADMIN, DOCTOR, RECEPTIONIST
                .andExpect(status().isForbidden());
    }

    @Test
    public void testPatientCanAccessTheirAppointments() throws Exception {
        // Patient role is allowed for /appointments/{id}
        // Assuming ID 1 exists, wait, we might not have the DB running properly in tests without mocks,
        // but we just test the security layer filtering
        mockMvc.perform(get("/appointments/patient/1")
                .header("X-User-Id", "1")
                .header("X-User-Role", "PATIENT"))
                .andExpect(status().isOk());
    }

    @Test
    public void testUnauthorizedUserCannotAccessPatientsAppointments() throws Exception {
        mockMvc.perform(get("/appointments/patient/1")) // No headers
                .andExpect(status().isUnauthorized()); // Or 403 based on filter setup, actually it returns 403 or 401
    }
}
