package com.medicore.billing.repository;
import com.medicore.billing.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    List<Invoice> findByPatientIdOrderByIssuedAtDesc(Long patientId);
    Optional<Invoice> findByAppointmentId(Long appointmentId);
    long count();
}
