package com.medicore.patient.service;

import com.medicore.patient.dto.PatientDtos.AnalyticsSummary;
import com.medicore.patient.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminAnalyticsService {
    private final PatientRepository patientRepository;

    public AnalyticsSummary getSummary() {
        AnalyticsSummary s = new AnalyticsSummary();
        s.setTotalPatients(patientRepository.count());
        s.setTotalDoctors(0);
        s.setTotalAppointments(0);
        s.setTotalInvoices(0);
        return s;
    }
}
