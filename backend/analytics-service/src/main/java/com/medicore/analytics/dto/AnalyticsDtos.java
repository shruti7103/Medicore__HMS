package com.medicore.analytics.dto;
import lombok.Data; import java.math.BigDecimal; import java.util.List;
public class AnalyticsDtos {
 @Data public static class Summary {
  private long totalPatients; private long totalDoctors; private long totalNurses;
  private long totalAppointments; private long todayAppointments; private long totalInvoices;
  private BigDecimal revenueThisMonth;
  private List<DeptSplit> departmentSplit; private List<RevenuePoint> revenueTrend;
 }
 @Data public static class DeptSplit { private String department; private long count; }
 @Data public static class RevenuePoint { private String month; private BigDecimal revenue; }
}
