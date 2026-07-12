import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ROLE_ROUTES } from '../types';
import {
  Activity, Calendar, Users, Pill, ShieldCheck, Heart, Stethoscope, Bell,
  ChevronRight, Star, CheckCircle2, Zap, Globe, Lock, BarChart3, Clock,
  Video, ArrowRight, Moon, Sun,
  Building2, TrendingUp, Award, Layers
} from 'lucide-react';

const FEATURES = [
  { icon: <Calendar className="w-7 h-7"/>, title: 'Smart Appointment Scheduling', desc: 'Drag-and-drop calendar with real-time availability. Book, reschedule, and cancel appointments effortlessly.', color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)' },
  { icon: <Stethoscope className="w-7 h-7"/>, title: 'Doctor Management', desc: 'Comprehensive doctor profiles, schedule management, e-prescriptions, and telemedicine integration.', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  { icon: <Users className="w-7 h-7"/>, title: 'Patient Records', desc: 'Complete patient history, vitals tracking, medical records, and HIPAA-compliant data management.', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  { icon: <Pill className="w-7 h-7"/>, title: 'Pharmacy Management', desc: 'Real-time prescription queue, inventory tracking, low-stock alerts and automated medication dispensing.', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  { icon: <Heart className="w-7 h-7"/>, title: 'Nursing Station', desc: 'Task management, vitals recording, medication administration records (MAR), and patient assignments.', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  { icon: <BarChart3 className="w-7 h-7"/>, title: 'Analytics & Reports', desc: 'Real-time hospital analytics, revenue reports, appointment statistics, and operational insights.', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
  { icon: <Video className="w-7 h-7"/>, title: 'Telemedicine', desc: 'Integrated video consultation rooms for remote patient care and follow-up appointments.', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },

  { icon: <ShieldCheck className="w-7 h-7"/>, title: 'Role-Based Access', desc: 'Granular permission matrix with Admin, Doctor, Nurse, Receptionist, Pharmacist and Patient roles.', color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)' },
];

const ROLES = [
  { icon: <ShieldCheck className="w-6 h-6"/>, role: 'Admin', desc: 'Full system control — users, departments, analytics & audit logs', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  { icon: <Stethoscope className="w-6 h-6"/>, role: 'Doctor', desc: 'Manage schedule, write e-prescriptions, join telemedicine sessions', color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)' },
  { icon: <Heart className="w-6 h-6"/>, role: 'Nurse', desc: 'Record vitals, manage tasks, log medication administration (MAR)', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  { icon: <Bell className="w-6 h-6"/>, role: 'Receptionist', desc: 'Book & schedule appointments, manage patient directory', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  { icon: <Pill className="w-6 h-6"/>, role: 'Pharmacist', desc: 'Dispense prescriptions, manage medicine inventory in real-time', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  { icon: <Users className="w-6 h-6"/>, role: 'Patient', desc: 'Book appointments, view prescriptions, pay bills online', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
];

const STATS = [
  { value: '99.9%', label: 'System Uptime', icon: <Zap className="w-5 h-5"/> },
  { value: '6+', label: 'Modules', icon: <Layers className="w-5 h-5"/> },
  { value: '< 50ms', label: 'Response Time', icon: <Clock className="w-5 h-5"/> },
  { value: '100%', label: 'HIPAA Compliant', icon: <Lock className="w-5 h-5"/> },
];

const TESTIMONIALS = [
  { name: 'Dr. Rajesh Sharma', role: 'Chief Medical Officer', quote: 'MediCore transformed our hospital operations. The telemedicine and prescription features are exceptional.', rating: 5, avatar: 'RS' },
  { name: 'Priya Kulkarni', role: 'Head Nurse, ICU', quote: 'The nursing station module makes our MAR and vitals recording seamless. A game changer for patient care.', rating: 5, avatar: 'PK' },
  { name: 'Ankit Mehta', role: 'Hospital Administrator', quote: 'Complete visibility into all departments, revenue reports, and staff management from one dashboard.', rating: 5, avatar: 'AM' },
];

export default function LandingPage() {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();

  return (
    <div style={{ background: 'var(--color-bg)' }} className="min-h-screen">
      {/* ===== NAVBAR ===== */}
      <nav className="sticky top-0 z-50 border-b" style={{ background: 'var(--color-surface-glass)', backdropFilter: 'blur(16px)', borderColor: 'var(--color-border)' }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' }}>
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>MediCore HMS</span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            {['Features', 'Roles', 'Testimonials'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="transition-colors hover:opacity-70" style={{ color: 'var(--color-muted)' }}>{item}</a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={toggle} className="btn-ghost btn-icon">
              {theme === 'light' ? <Moon size={17}/> : <Sun size={17}/>}
            </button>
            {user ? (
              <Link to={ROLE_ROUTES[user.role]} className="btn-primary text-sm">
                Go to Dashboard <ChevronRight size={15}/>
              </Link>
            ) : (
              <Link to="/login" className="btn-primary text-sm">
                Sign In <ChevronRight size={15}/>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="hero-bg relative overflow-hidden py-20 md:py-28">
        {/* Background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl opacity-20" style={{ background: 'var(--color-primary)' }} />
          <div className="absolute top-1/2 -right-24 w-[500px] h-[500px] rounded-full blur-3xl opacity-15" style={{ background: 'var(--color-secondary)' }} />
          <div className="absolute -bottom-32 left-1/3 w-80 h-80 rounded-full blur-3xl opacity-15" style={{ background: 'var(--color-accent)' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium mb-6"
            style={{ background: 'var(--color-primary-light)', borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
            <Zap size={14}/> Modern Hospital Management System
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Healthcare Management<br />
            <span className="gradient-text">Reimagined</span>
          </h1>

          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10" style={{ color: 'var(--color-muted)' }}>
            A comprehensive, role-based hospital management platform with real-time dashboards,
            telemedicine, smart scheduling, and seamless pharmacy integration.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-16">
            <Link to={user ? ROLE_ROUTES[user.role] : '/login'} className="btn-primary text-base px-8 py-3.5">
              {user ? 'Open Dashboard' : 'Get Started Free'} <ArrowRight size={18}/>
            </Link>
            <a href="#features" className="btn-secondary text-base px-8 py-3.5">
              <CheckCircle2 size={18}/> Explore Features
            </a>
          </div>

          {/* Hero Preview Cards */}
          <div className="grid sm:grid-cols-4 gap-4 max-w-4xl mx-auto stagger-children">
            {STATS.map(s => (
              <div key={s.label} className="glass-card p-5 text-center animate-fade-up">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                  {s.icon}
                </div>
                <p className="text-2xl font-bold gradient-text">{s.value}</p>
                <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-4" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
              <Globe size={13}/> COMPREHENSIVE MODULES
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Everything Your Hospital Needs
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--color-muted)' }}>
              From patient registration to pharmacy dispensing — all modules work seamlessly together.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
            {FEATURES.map((f) => (
              <div key={f.title} className="card p-6 group cursor-default animate-fade-up" style={{ borderTop: `3px solid ${f.color}` }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all group-hover:scale-110"
                  style={{ background: f.bg, color: f.color }}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ROLES ===== */}
      <section id="roles" className="py-20" style={{ background: 'var(--color-surface)' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-4" style={{ background: 'var(--color-secondary-light)', color: 'var(--color-secondary)' }}>
              <Users size={13}/> ROLE-BASED ACCESS CONTROL
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Tailored for Every Role
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--color-muted)' }}>
              Custom dashboards and permissions for every member of your hospital staff.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
            {ROLES.map((r) => (
              <div key={r.role} className="card-glass p-5 group hover:shadow-lg transition-all duration-300 animate-fade-up">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-all group-hover:scale-110"
                    style={{ background: r.bg, color: r.color }}>
                    {r.icon}
                  </div>
                  <h3 className="font-bold text-lg">{r.role}</h3>
                </div>
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{r.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-xs font-semibold" style={{ color: r.color }}>
                  <CheckCircle2 size={13}/> Dedicated Dashboard
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== WHY CHOOSE ===== */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                <Award size={13}/> WHY MEDICORE HMS
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Built for<br/><span className="gradient-text">Modern Healthcare</span>
              </h2>
              <div className="space-y-4">
                {[
                  { title: 'Real-time WebSocket Updates', desc: 'Live prescription queues, notifications, and status updates without page refresh.', icon: <Zap size={18}/> },
                  { title: 'Microservices Architecture', desc: 'Scalable Spring Boot services with Eureka service discovery and API Gateway.', icon: <Layers size={18}/> },
                  { title: 'Telemedicine Integration', desc: 'Built-in video consultation rooms for remote patient care.', icon: <Video size={18}/> },
                  { title: 'HIPAA-Compliant Security', desc: 'JWT authentication, role-based access control, and complete audit trails.', icon: <Lock size={18}/> },
                ].map(item => (
                  <div key={item.title} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{item.title}</h4>
                      <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: <TrendingUp size={28}/>, value: '40%', label: 'Reduction in Administrative Time', color: '#0ea5e9' },
                { icon: <Clock size={28}/>, value: '24/7', label: 'System Availability & Support', color: '#10b981' },
                { icon: <Users size={28}/>, value: '6+', label: 'Specialized Dashboards', color: '#8b5cf6' },
                { icon: <Building2 size={28}/>, value: '∞', label: 'Departments Supported', color: '#f59e0b' },
              ].map(item => (
                <div key={item.label} className="card p-6 text-center" style={{ borderTop: `3px solid ${item.color}` }}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: `${item.color}15`, color: item.color }}>
                    {item.icon}
                  </div>
                  <p className="text-3xl font-bold mb-1" style={{ color: item.color }}>{item.value}</p>
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section id="testimonials" className="py-20" style={{ background: 'var(--color-surface)' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Trusted by Healthcare Professionals
            </h2>
            <p className="text-lg" style={{ color: 'var(--color-muted)' }}>What the teams say about MediCore HMS</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="card p-6">
                <div className="flex mb-3">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} size={16} className="fill-current" style={{ color: '#f59e0b' }} />
                  ))}
                </div>
                <p className="text-sm mb-5 italic leading-relaxed" style={{ color: 'var(--color-ink-secondary)' }}>"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' }}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)' }} />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Ready to Transform Your Hospital?
          </h2>
          <p className="text-lg text-white/80 mb-8">
            Get started with MediCore HMS today — full-featured and ready for your team.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/login" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-base bg-white transition-all hover:shadow-xl hover:-translate-y-1"
              style={{ color: 'var(--color-primary)' }}>
              Start Now <ArrowRight size={18}/>
            </Link>
            <Link to="/register" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-base text-white border-2 border-white/40 hover:border-white hover:bg-white/10 transition-all">
              Register as Patient
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t py-10" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' }}>
                <Activity className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>MediCore HMS</p>
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Hospital Management System</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-sm" style={{ color: 'var(--color-muted)' }}>
              <Link to="/login" className="hover:opacity-70 transition-opacity">Sign In</Link>
              <Link to="/register" className="hover:opacity-70 transition-opacity">Register</Link>
              <span>© {new Date().getFullYear()} MediCore HMS. All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
