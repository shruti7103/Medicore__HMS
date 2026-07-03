export type Role = 'ADMIN' | 'DOCTOR' | 'NURSE' | 'RECEPTIONIST' | 'PATIENT' | 'PHARMACIST';
export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export type PrescriptionStatus = 'PENDING' | 'DISPENSED' | 'CANCELLED';
export type InvoiceStatus = 'UNPAID' | 'PAID' | 'CANCELLED';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface ApiResponse<T> { success: boolean; message: string; data: T; }
export interface User { id: number; name: string; email: string; role: Role; isActive?: boolean; }
export interface AuthTokens { accessToken: string; refreshToken: string; user: User; }
export interface Patient { id: number; userId: number; firstName: string; lastName: string; phone?: string; }
export interface Doctor { id: number; firstName: string; lastName: string; department?: string; specialization?: string; }
export interface Appointment { id: number; patientId: number; doctorId: number; slotStart: string; slotEnd: string; status: AppointmentStatus; reason?: string; telemedicineLink?: string; }
export interface Invoice { id: number; patientId: number; amount: number; status: InvoiceStatus; appointmentId?: number; }
export interface Prescription { id: number; patientId: number; doctorId: number; status: PrescriptionStatus; items?: { id: number; medicineId: number; dosage: string; frequency: string; durationDays: number }[]; }
export interface Medicine { id: number; name: string; stockQty: number; unitPrice: number; reorderLevel?: number; description?: string; }
export interface NursingTask { id: number; patientId: number; title: string; status: TaskStatus; dueAt?: string; }
export interface Notification { id: number; title: string; message: string; isRead: boolean; type: string; }
export interface AnalyticsSummary { totalPatients: number; totalDoctors: number; totalNurses?: number; totalAppointments: number; todayAppointments?: number; totalInvoices?: number; revenueThisMonth?: number; }
export interface AuditLog { id: number; action: string; entityType: string; details?: string; createdAt?: string; }

export const ROLE_ROUTES: Record<Role, string> = {
  ADMIN: '/admin', DOCTOR: '/doctor', NURSE: '/nurse', RECEPTIONIST: '/receptionist', PATIENT: '/patient', PHARMACIST: '/pharmacist',
};
