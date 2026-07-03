package com.medicore.analytics.service;
import com.medicore.analytics.dto.AnalyticsDtos.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.math.BigDecimal; import java.util.*;
@Service @RequiredArgsConstructor
public class AnalyticsService {
 private final RestTemplate restTemplate;
 private long count(String url) {
  try { Map<?,?> r=restTemplate.getForObject(url, Map.class); if(r!=null && r.get("data") instanceof Map<?,?> d) return ((Number)d.get("count")).longValue(); } catch(Exception ignored) {}
  return 0;
 }
 public Summary summary() {
  Summary s=new Summary();
  s.setTotalPatients(count("http://patient-service/internal/stats"));
  s.setTotalDoctors(count("http://doctor-service/internal/stats"));
  s.setTotalNurses(count("http://nurse-service/internal/stats"));
  s.setTotalAppointments(count("http://appointment-service/internal/stats"));
  s.setTotalInvoices(count("http://billing-service/internal/stats"));
  s.setTodayAppointments(count("http://appointment-service/internal/stats/today"));
  s.setRevenueThisMonth(BigDecimal.valueOf(count("http://billing-service/internal/stats/revenue")));
  s.setDepartmentSplit(List.of(new DeptSplit(){{setDepartment("General");setCount(s.getTotalDoctors());}}));
  s.setRevenueTrend(List.of(new RevenuePoint(){{setMonth("Jan");setRevenue(s.getRevenueThisMonth());}}));
  return s;
 }
}
