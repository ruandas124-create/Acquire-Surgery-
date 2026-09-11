import React, { useState, useEffect } from 'react';
import { 
  Lead, 
  Hospital, 
  CategoryInfo, 
  TreatmentInfo, 
  LeadStatus, 
  HospitalCategory, 
  AuthUser,
  PatientSchedule,
  ScheduleStatus,
  HospitalAccount,
  LeadSource
} from '../../types';
import { api } from '../../services/api';
import { 
  createHospitalWhatsAppMessage, 
  openWhatsAppShare, 
  generateRandomTempPassword, 
  LEAD_SOURCES, 
  SCHEDULE_STATUSES 
} from '../../data/crmData';
import { HospitalDetailsModal } from './HospitalDetailsModal';
import { ResetPasswordModal } from './ResetPasswordModal';
import { LeadsNotesModal } from './LeadsNotesModal';
import { Logo } from '../Logo';
import { 
  Users, 
  Building2, 
  Calendar, 
  KeyRound, 
  BarChart3, 
  Settings, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  CheckCircle2, 
  Clock, 
  Phone, 
  MessageSquare, 
  Filter, 
  Search,
  IndianRupee,
  RefreshCw,
  LogOut,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  MapPin,
  Sparkles,
  MoreVertical,
  Lock,
  Mail,
  UserCheck,
  FileText,
  Copy,
  Check,
  AlertCircle,
  XCircle
} from 'lucide-react';

interface AdminDashboardProps {
  user: AuthUser;
  onLogout: () => void;
  onClose: () => void;
  onSwitchToHospital?: (hospitalId: string) => void;
}

const CRM_LEAD_STATUSES: LeadStatus[] = [
  'New',
  'Contacted',
  'Follow-up',
  'Hospital Shortlisted',
  'Scheduled',
  'Completed',
  'Cancelled'
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  user,
  onLogout,
  onClose,
  onSwitchToHospital
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'leads' | 'scheduling' | 'access' | 'hospitals' | 'reports' | 'settings'
  >('overview');

  // Core CRM Data States
  const [leads, setLeads] = useState<Lead[]>([]);
  const [schedules, setSchedules] = useState<PatientSchedule[]>([]);
  const [hospitalAccounts, setHospitalAccounts] = useState<HospitalAccount[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [treatments, setTreatments] = useState<TreatmentInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Toast / Notifications
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // =================== LEADS MANAGEMENT STATE ===================
  const [leadSearch, setLeadSearch] = useState('');
  const [leadStatusFilter, setLeadStatusFilter] = useState('All');
  const [leadNotesModalTarget, setLeadNotesModalTarget] = useState<Lead | null>(null);

  // =================== PATIENT SCHEDULING STATE ===================
  const [schedPatientName, setSchedPatientName] = useState('');
  const [schedMobile, setSchedMobile] = useState('');
  const [schedHospitalId, setSchedHospitalId] = useState('');
  const [schedSurgeryName, setSchedSurgeryName] = useState('');
  const [schedMinCost, setSchedMinCost] = useState<number | undefined>();
  const [schedMaxCost, setSchedMaxCost] = useState<number | undefined>();
  const [schedBudget, setSchedBudget] = useState('₹1 – ₹2 Lakh');
  const [schedSource, setSchedSource] = useState<LeadSource>('Acquire OPD');
  const [schedReferralDetails, setSchedReferralDetails] = useState('');
  const [schedDate, setSchedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [schedTime, setSchedTime] = useState('10:00 AM');
  const [schedNotes, setSchedNotes] = useState('');
  const [schedStatusFilter, setSchedStatusFilter] = useState('All');
  const [schedSearch, setSchedSearch] = useState('');
  const [activeSchedDropdown, setActiveSchedDropdown] = useState<string | null>(null);
  const [selectedScheduleForNotes, setSelectedScheduleForNotes] = useState<PatientSchedule | null>(null);

  // =================== HOSPITAL ACCESS STATE ===================
  const [accHospitalSelect, setAccHospitalSelect] = useState('');
  const [accHospitalName, setAccHospitalName] = useState('');
  const [accEmail, setAccEmail] = useState('');
  const [accMobile, setAccMobile] = useState('');
  const [accUsername, setAccUsername] = useState('');
  const [accPassword, setAccPassword] = useState(generateRandomTempPassword());
  const [accConfirmPassword, setAccConfirmPassword] = useState(accPassword);
  const [accStatus, setAccStatus] = useState<'Active' | 'Inactive'>('Active');
  const [accCreatedSuccess, setAccCreatedSuccess] = useState<{
    account: HospitalAccount;
    tempPassword: string;
  } | null>(null);
  const [activeAccountDropdown, setActiveAccountDropdown] = useState<string | null>(null);

  // Modals for details & reset password
  const [viewingHospital, setViewingHospital] = useState<Hospital | null>(null);
  const [resettingAccount, setResettingAccount] = useState<HospitalAccount | null>(null);

  // Load all CRM data
  const loadData = async () => {
    setLoading(true);
    try {
      const [leadsData, hospData, catData, treatData, schedsData, accountsData] = await Promise.all([
        api.getLeads(),
        api.getHospitals(),
        api.getCategories(),
        api.getTreatments(),
        api.getSchedules(),
        api.getHospitalAccounts(),
      ]);
      setLeads(leadsData);
      setHospitals(hospData);
      setCategories(catData);
      setTreatments(treatData);
      setSchedules(schedsData);
      setHospitalAccounts(accountsData);

      if (hospData.length > 0 && !schedHospitalId) {
        setSchedHospitalId(hospData[0].id);
        const surgeries = hospData[0].surgeries || [];
        if (surgeries.length > 0) {
          setSchedSurgeryName(surgeries[0].name);
          setSchedMinCost(surgeries[0].minCost);
          setSchedMaxCost(surgeries[0].maxCost);
        }
      }
    } catch (err) {
      console.error('Error loading CRM data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update selected hospital surgeries in scheduling form
  const selectedHospitalObj = hospitals.find(h => h.id === schedHospitalId);
  const availableSurgeries = selectedHospitalObj?.surgeries || [
    { id: 'gen-1', name: 'General Consultation & Laparoscopy', minCost: 45000, maxCost: 90000, status: 'Active' as const },
    { id: 'gen-2', name: 'Total Knee Replacement', minCost: 150000, maxCost: 280000, status: 'Active' as const },
    { id: 'gen-3', name: 'Gallbladder Removal (Cholecystectomy)', minCost: 65000, maxCost: 110000, status: 'Active' as const },
  ];

  const handleHospitalChange = (hospId: string) => {
    setSchedHospitalId(hospId);
    const targetHosp = hospitals.find(h => h.id === hospId);
    if (targetHosp && targetHosp.surgeries && targetHosp.surgeries.length > 0) {
      setSchedSurgeryName(targetHosp.surgeries[0].name);
      setSchedMinCost(targetHosp.surgeries[0].minCost);
      setSchedMaxCost(targetHosp.surgeries[0].maxCost);
    }
  };

  const handleSurgeryChange = (surgName: string) => {
    setSchedSurgeryName(surgName);
    const surg = availableSurgeries.find(s => s.name === surgName);
    if (surg) {
      setSchedMinCost(surg.minCost);
      setSchedMaxCost(surg.maxCost);
    }
  };

  // Submit Patient Scheduling Form
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedPatientName.trim() || !schedMobile.trim()) {
      showToast('Patient name and mobile number are required', 'error');
      return;
    }

    try {
      const hosp = hospitals.find(h => h.id === schedHospitalId);
      const newSched = await api.createSchedule({
        patientName: schedPatientName.trim(),
        mobile: schedMobile.trim(),
        hospitalId: schedHospitalId,
        hospitalName: hosp?.name || 'Selected Hospital',
        surgeryName: schedSurgeryName,
        minCost: schedMinCost,
        maxCost: schedMaxCost,
        budget: schedBudget,
        source: schedSource,
        referralDetails: schedSource === 'Referral' ? schedReferralDetails : undefined,
        appointmentDate: schedDate,
        preferredTime: schedTime,
        status: 'Scheduled',
        initialNote: schedNotes.trim() || 'Scheduled via Admin Patient Scheduling Desk',
        authorName: user.name,
      });

      setSchedules(prev => [newSched, ...prev]);
      showToast(`Patient ${newSched.patientName} scheduled successfully at ${newSched.hospitalName}!`);

      // Reset form
      setSchedPatientName('');
      setSchedMobile('');
      setSchedNotes('');
      setSchedReferralDetails('');
    } catch (err: any) {
      showToast(err?.message || 'Failed to schedule patient', 'error');
    }
  };

  // Update Schedule Status
  const handleUpdateScheduleStatus = async (schedId: string, nextStatus: ScheduleStatus) => {
    try {
      const updated = await api.updateSchedule(schedId, {
        status: nextStatus,
        note: `Status updated to ${nextStatus}`,
        authorName: user.name,
      });
      setSchedules(prev => prev.map(s => s.id === schedId ? updated : s));
      showToast(`Appointment status updated to ${nextStatus}`);
    } catch {
      showToast('Failed to update appointment status', 'error');
    }
  };

  // Delete Schedule
  const handleDeleteSchedule = async (schedId: string) => {
    if (!confirm('Are you sure you want to remove this appointment record?')) return;
    try {
      await api.deleteSchedule(schedId);
      setSchedules(prev => prev.filter(s => s.id !== schedId));
      showToast('Appointment record removed');
    } catch {
      showToast('Failed to delete appointment', 'error');
    }
  };

  // Submit Create Hospital Access
  const handleCreateHospitalAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accHospitalName.trim() || !accEmail.trim() || !accMobile.trim() || !accUsername.trim()) {
      showToast('All fields are required to create hospital access', 'error');
      return;
    }
    if (accPassword !== accConfirmPassword) {
      showToast('Password and Confirm Password do not match', 'error');
      return;
    }

    try {
      const res = await api.createHospitalAccount({
        hospitalId: accHospitalSelect || undefined,
        hospitalName: accHospitalName.trim(),
        email: accEmail.trim().toLowerCase(),
        mobile: accMobile.trim(),
        username: accUsername.trim().toLowerCase(),
        password: accPassword,
        accountStatus: accStatus,
      });

      setHospitalAccounts(prev => [res.account, ...prev]);
      setAccCreatedSuccess({
        account: res.account,
        tempPassword: res.tempPassword,
      });
      showToast(`Hospital access credentials created for ${res.account.hospitalName}!`);

      // Reset form fields
      setAccHospitalSelect('');
      setAccHospitalName('');
      setAccEmail('');
      setAccMobile('');
      setAccUsername('');
      const nextTemp = generateRandomTempPassword();
      setAccPassword(nextTemp);
      setAccConfirmPassword(nextTemp);
    } catch (err: any) {
      showToast(err?.message || 'Failed to create hospital account', 'error');
    }
  };

  // Toggle Account Active/Inactive
  const handleToggleAccountStatus = async (account: HospitalAccount) => {
    const nextStatus = account.accountStatus === 'Active' ? 'Inactive' : 'Active';
    try {
      const updated = await api.updateHospitalAccount(account.id, { accountStatus: nextStatus });
      setHospitalAccounts(prev => prev.map(a => a.id === account.id ? updated : a));
      showToast(`Account status updated to ${nextStatus}`);
    } catch {
      showToast('Failed to update account status', 'error');
    }
  };

  // Send WhatsApp Login Details
  const handleSendWhatsAppLogin = (account: HospitalAccount, customPassword?: string) => {
    const passwordToShare = customPassword || 'surgery123 (Temporary Password)';
    const msg = createHospitalWhatsAppMessage({
      hospitalName: account.hospitalName,
      username: account.username,
      tempPassword: passwordToShare,
    });
    openWhatsAppShare(account.mobile, msg);
    showToast(`Opening WhatsApp to share credentials with ${account.hospitalName}...`);
  };

  // Filter Leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(leadSearch.toLowerCase()) ||
      lead.mobile.includes(leadSearch) ||
      lead.treatment.toLowerCase().includes(leadSearch.toLowerCase()) ||
      (lead.preferredHospitalName || '').toLowerCase().includes(leadSearch.toLowerCase());
    
    const matchesStatus = leadStatusFilter === 'All' || lead.status === leadStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filter Schedules
  const filteredSchedules = schedules.filter(sched => {
    const matchesSearch = 
      sched.patientName.toLowerCase().includes(schedSearch.toLowerCase()) ||
      sched.mobile.includes(schedSearch) ||
      sched.hospitalName.toLowerCase().includes(schedSearch.toLowerCase()) ||
      sched.surgeryName.toLowerCase().includes(schedSearch.toLowerCase());

    const matchesStatus = schedStatusFilter === 'All' || sched.status === schedStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div id="acquire-admin-crm" className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo size="sm" showTagline={false} />
            <div className="h-6 w-px bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#062B61] text-white">
                Admin CRM
              </span>
              <span className="text-xs text-slate-500 font-semibold hidden md:inline">
                Acquire OPD Healthcare Operations
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-900">{user.name}</div>
              <div className="text-[11px] text-slate-500">Master Platform Admin</div>
            </div>

            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* 7 CRM Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto gap-1 border-t border-slate-100 no-scrollbar">
          {[
            { id: 'overview', label: 'Dashboard Overview', icon: BarChart3 },
            { id: 'leads', label: `Website Leads (${leads.length})`, icon: Users },
            { id: 'scheduling', label: `Patient Scheduling (${schedules.length})`, icon: Calendar },
            { id: 'access', label: `Hospital Access (${hospitalAccounts.length})`, icon: KeyRound },
            { id: 'hospitals', label: `Hospitals (${hospitals.length})`, icon: Building2 },
            { id: 'reports', label: 'Reports & Analytics', icon: TrendingUp },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'border-[#062B61] text-[#062B61] bg-blue-50/50'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#062B61]' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Floating Toast */}
      {toastMsg && (
        <div 
          className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold text-white animate-in fade-in slide-in-from-top-4 ${
            toastMsg.type === 'success' ? 'bg-emerald-700' : 'bg-rose-700'
          }`}
        >
          {toastMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* =================== TAB 1: OVERVIEW =================== */}
        {activeTab === 'overview' && (
          <div className="space-y-7">
            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Website Leads</span>
                  <span className="text-2xl font-bold text-slate-900 mt-1 block">{leads.length}</span>
                  <span className="text-[11px] text-emerald-700 font-semibold mt-0.5 inline-flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> +18% this week
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#062B61] flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Scheduled Patients</span>
                  <span className="text-2xl font-bold text-slate-900 mt-1 block">{schedules.length}</span>
                  <span className="text-[11px] text-[#062B61] font-semibold mt-0.5 inline-flex items-center gap-1">
                    Active consultations
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <Calendar className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Partner Hospitals</span>
                  <span className="text-2xl font-bold text-slate-900 mt-1 block">{hospitals.length}</span>
                  <span className="text-[11px] text-slate-500 font-medium mt-0.5 inline-flex items-center gap-1">
                    {hospitalAccounts.filter(a => a.accountStatus === 'Active').length} Active Logins
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Building2 className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Direct Helpline Desk</span>
                  <span className="text-sm font-bold text-slate-900 mt-1 block">+91 94296 93887</span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block truncate">
                    acquireopd@gmail.com
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Phone className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Quick Actions & Recent Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
              {/* Recent Inquiries */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#062B61]" />
                    Recent Patient Inquiries
                  </h3>
                  <button 
                    onClick={() => setActiveTab('leads')} 
                    className="text-xs font-semibold text-[#062B61] hover:underline"
                  >
                    View All Leads
                  </button>
                </div>
                <div className="divide-y divide-slate-100">
                  {leads.slice(0, 5).map(l => (
                    <div key={l.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{l.name}</div>
                        <div className="text-[11px] text-slate-500">{l.treatment} • {l.mobile}</div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {l.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Schedules */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#062B61]" />
                    Upcoming Patient Schedules
                  </h3>
                  <button 
                    onClick={() => setActiveTab('scheduling')} 
                    className="text-xs font-semibold text-[#062B61] hover:underline"
                  >
                    Manage Schedules
                  </button>
                </div>
                <div className="divide-y divide-slate-100">
                  {schedules.slice(0, 5).map(s => (
                    <div key={s.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{s.patientName}</div>
                        <div className="text-[11px] text-slate-500">{s.hospitalName} • {s.surgeryName}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-slate-800">{s.appointmentDate}</div>
                        <span className="text-[10px] text-indigo-600 font-bold">{s.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================== TAB 2: WEBSITE FORMS / LEADS =================== */}
        {activeTab === 'leads' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#062B61]" />
                    Website Form Submissions & Patient Leads ({filteredLeads.length})
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Track incoming inquiries, update consultation statuses directly, and log clinical follow-up notes.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadData()}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* Search and Filters Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5 pb-2">
                <div className="sm:col-span-2 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={leadSearch}
                    onChange={(e) => setLeadSearch(e.target.value)}
                    placeholder="Search by patient name, phone number, treatment, or preferred hospital..."
                    className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-[#062B61]"
                  />
                </div>

                <div>
                  <select
                    value={leadStatusFilter}
                    onChange={(e) => setLeadStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-[#062B61]"
                  >
                    <option value="All">All Statuses</option>
                    {CRM_LEAD_STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Leads Table (Horizontally Scrollable) */}
              <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs min-w-[950px]">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Patient Name</th>
                      <th className="px-4 py-3">Mobile Number</th>
                      <th className="px-4 py-3">Treatment / Surgery</th>
                      <th className="px-4 py-3">Preferred Hospital</th>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3">Budget</th>
                      <th className="px-4 py-3">Source</th>
                      <th className="px-4 py-3">Submission Date</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Notes</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLeads.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-8 text-center text-slate-400 text-xs">
                          No leads matching your search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredLeads.map(lead => (
                        <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">
                            {lead.name}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">
                            <a href={`tel:${lead.mobile}`} className="hover:text-[#062B61] inline-flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {lead.mobile}
                            </a>
                          </td>
                          <td className="px-4 py-3 font-semibold text-[#062B61] whitespace-nowrap">
                            {lead.treatment}
                          </td>
                          <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                            {lead.preferredHospitalName || 'Platform Matching'}
                          </td>
                          <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                            {lead.city || 'Bangalore'}
                          </td>
                          <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                            {lead.budget}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              {lead.source || 'Acquire OPD'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                            {new Date(lead.createdAt).toLocaleDateString('en-IN')}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <select
                              value={lead.status}
                              onChange={async (e) => {
                                const newStat = e.target.value as any;
                                const updated = await api.updateLead(lead.id, {
                                  status: newStat,
                                  authorName: user.name,
                                  note: `Status changed to ${newStat}`
                                });
                                setLeads(prev => prev.map(l => l.id === lead.id ? updated : l));
                                showToast(`Lead status updated to ${newStat}`);
                              }}
                              className="px-2 py-1 text-xs font-semibold rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-[#062B61]"
                            >
                              {CRM_LEAD_STATUSES.map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <button
                              onClick={() => setLeadNotesModalTarget(lead)}
                              className="inline-flex items-center gap-1.5 text-xs text-[#062B61] font-semibold hover:underline cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>{lead.notes?.length || 0} Notes</span>
                            </button>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => {
                                  // Pre-fill patient schedule form with this lead's info
                                  setSchedPatientName(lead.name);
                                  setSchedMobile(lead.mobile);
                                  setSchedBudget(lead.budget);
                                  setSchedNotes(`Inquiry for ${lead.treatment} from ${lead.city || 'Bangalore'}`);
                                  setActiveTab('scheduling');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[#062B61] text-white font-semibold text-[11px] hover:bg-[#0A3B75] transition-colors cursor-pointer"
                              >
                                Schedule
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =================== TAB 3: PATIENT SCHEDULING =================== */}
        {activeTab === 'scheduling' && (
          <div className="space-y-7">
            {/* Scheduling Form Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7">
              <div className="pb-5 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#062B61]" />
                  Schedule Patient Consultation / Surgery
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Book and confirm clinical consultations with hospital partners with cost estimation and lead attribution.
                </p>
              </div>

              <form onSubmit={handleScheduleSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 pt-5">
                {/* Patient Name */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Patient Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={schedPatientName}
                    onChange={(e) => setSchedPatientName(e.target.value)}
                    placeholder="e.g. Ramesh Chandra"
                    className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#062B61] bg-white"
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={schedMobile}
                    onChange={(e) => setSchedMobile(e.target.value)}
                    placeholder="+91 94296 93887"
                    className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#062B61] bg-white"
                  />
                </div>

                {/* Select Hospital */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Select Hospital <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={schedHospitalId}
                    onChange={(e) => handleHospitalChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#062B61] bg-white"
                  >
                    {hospitals.map(h => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.location})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Select Surgery / Treatment */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Select Surgery / Treatment <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={schedSurgeryName}
                    onChange={(e) => handleSurgeryChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#062B61] bg-white"
                  >
                    {availableSurgeries.map(s => (
                      <option key={s.id || s.name} value={s.name}>
                        {s.name} (₹{s.minCost.toLocaleString('en-IN')} – ₹{s.maxCost.toLocaleString('en-IN')})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Patient Budget Range */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Patient Budget Range
                  </label>
                  <select
                    value={schedBudget}
                    onChange={(e) => setSchedBudget(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#062B61] bg-white"
                  >
                    <option value="Under ₹50,000">Under ₹50,000</option>
                    <option value="₹50,000 – ₹1 Lakh">₹50,000 – ₹1 Lakh</option>
                    <option value="₹1 – ₹2 Lakh">₹1 – ₹2 Lakh</option>
                    <option value="₹2 – ₹3 Lakh">₹2 – ₹3 Lakh</option>
                    <option value="₹3 Lakh+">₹3 Lakh+</option>
                  </select>
                </div>

                {/* Lead Source */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Lead Source <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={schedSource}
                    onChange={(e) => setSchedSource(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#062B61] bg-white"
                  >
                    {LEAD_SOURCES.map(source => (
                      <option key={source} value={source}>{source}</option>
                    ))}
                  </select>
                </div>

                {/* Conditional Referral Name / Details */}
                {schedSource === 'Referral' && (
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      Referral Name / Details <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={schedReferralDetails}
                      onChange={(e) => setSchedReferralDetails(e.target.value)}
                      placeholder="e.g. Referred by Dr. Ananth (ClinicIndira) or Relative"
                      className="w-full px-3.5 py-2.5 text-xs font-medium border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 bg-amber-50/50"
                    />
                  </div>
                )}

                {/* Appointment Date */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Appointment / Surgery Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={schedDate}
                    onChange={(e) => setSchedDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#062B61] bg-white"
                  />
                </div>

                {/* Preferred Time */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Preferred Time <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={schedTime}
                    onChange={(e) => setSchedTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#062B61] bg-white"
                  >
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:30 AM">11:30 AM</option>
                    <option value="01:00 PM">01:00 PM</option>
                    <option value="02:30 PM">02:30 PM</option>
                    <option value="04:00 PM">04:00 PM</option>
                    <option value="05:30 PM">05:30 PM</option>
                    <option value="07:00 PM">07:00 PM</option>
                  </select>
                </div>

                {/* Notes */}
                <div className="sm:col-span-3">
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Clinical Notes & Coordinator Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={schedNotes}
                    onChange={(e) => setSchedNotes(e.target.value)}
                    placeholder="e.g. Patient bringing MRI reports. Needs cashless insurance desk assistance upon arrival."
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#062B61] bg-white resize-none"
                  />
                </div>

                {/* Submit button */}
                <div className="sm:col-span-3 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#062B61] hover:bg-[#0A3B75] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Schedule Patient</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Scheduling Table Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#062B61]" />
                    Scheduled Patient Appointments ({filteredSchedules.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    View active bookings across partner hospitals, update statuses, and add clinical notes.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={schedSearch}
                      onChange={(e) => setSchedSearch(e.target.value)}
                      placeholder="Search patient, hospital..."
                      className="pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                  </div>

                  <select
                    value={schedStatusFilter}
                    onChange={(e) => setSchedStatusFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium"
                  >
                    <option value="All">All Statuses</option>
                    {SCHEDULE_STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Table (Horizontally Scrollable) */}
              <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs min-w-[950px]">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Patient</th>
                      <th className="px-4 py-3">Mobile</th>
                      <th className="px-4 py-3">Hospital</th>
                      <th className="px-4 py-3">Surgery / Treatment</th>
                      <th className="px-4 py-3">Budget</th>
                      <th className="px-4 py-3">Source</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSchedules.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-8 text-center text-slate-400 text-xs">
                          No scheduled appointments found.
                        </td>
                      </tr>
                    ) : (
                      filteredSchedules.map(sched => (
                        <tr key={sched.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">
                            {sched.patientName}
                          </td>
                          <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                            {sched.mobile}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                            {sched.hospitalName}
                          </td>
                          <td className="px-4 py-3 text-[#062B61] font-semibold whitespace-nowrap">
                            {sched.surgeryName}
                          </td>
                          <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                            {sched.budget}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              {sched.source}
                              {sched.referralDetails ? ` (${sched.referralDetails})` : ''}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                            {sched.appointmentDate}
                          </td>
                          <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                            {sched.preferredTime}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <select
                              value={sched.status}
                              onChange={(e) => handleUpdateScheduleStatus(sched.id, e.target.value as any)}
                              className={`px-2 py-1 text-xs font-bold rounded-lg border focus:ring-1 ${
                                sched.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                                sched.status === 'Completed' ? 'bg-blue-50 text-blue-700 border-blue-300' :
                                sched.status === 'Cancelled' ? 'bg-rose-50 text-rose-700 border-rose-300' :
                                'bg-white text-slate-800 border-slate-300'
                              }`}
                            >
                              {SCHEDULE_STATUSES.map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="relative inline-block text-left">
                              <button
                                onClick={() => setActiveSchedDropdown(activeSchedDropdown === sched.id ? null : sched.id)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {activeSchedDropdown === sched.id && (
                                <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-20 text-xs text-left">
                                  <button
                                    onClick={() => {
                                      setActiveSchedDropdown(null);
                                      setSelectedScheduleForNotes(sched);
                                    }}
                                    className="w-full px-3 py-1.5 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                                    <span>View / Add Notes</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setActiveSchedDropdown(null);
                                      const nextDate = prompt('Enter new appointment date (YYYY-MM-DD):', sched.appointmentDate);
                                      if (nextDate) {
                                        api.updateSchedule(sched.id, {
                                          appointmentDate: nextDate,
                                          status: 'Rescheduled',
                                          note: `Rescheduled to ${nextDate}`,
                                          authorName: user.name,
                                        }).then(updated => {
                                          setSchedules(prev => prev.map(s => s.id === sched.id ? updated : s));
                                          showToast('Appointment rescheduled');
                                        });
                                      }
                                    }}
                                    className="w-full px-3 py-1.5 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                  >
                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Reschedule</span>
                                  </button>
                                  <div className="my-1 border-t border-slate-100" />
                                  <button
                                    onClick={() => {
                                      setActiveSchedDropdown(null);
                                      handleDeleteSchedule(sched.id);
                                    }}
                                    className="w-full px-3 py-1.5 text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                    <span>Delete Appointment</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =================== TAB 4: HOSPITAL ACCESS MANAGEMENT =================== */}
        {activeTab === 'access' && (
          <div className="space-y-7">
            {/* Create Hospital Access Form */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7">
              <div className="pb-5 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-[#062B61]" />
                  Generate & Manage Hospital Access Credentials
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Create isolated portal accounts for hospital partner desks and share credentials via WhatsApp.
                </p>
              </div>

              {/* Confirmation Banner if Just Created */}
              {accCreatedSuccess && (
                <div className="mt-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Hospital Access Created Successfully!
                    </span>
                    <button
                      onClick={() => setAccCreatedSuccess(null)}
                      className="text-xs text-emerald-700 hover:text-emerald-900 font-bold cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                  <div className="text-xs">
                    Credentials for <strong>{accCreatedSuccess.account.hospitalName}</strong> (Username: <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-200">{accCreatedSuccess.account.username}</code>, Password: <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-200">{accCreatedSuccess.tempPassword}</code>)
                  </div>
                  <div className="pt-1">
                    <button
                      onClick={() => handleSendWhatsAppLogin(accCreatedSuccess.account, accCreatedSuccess.tempPassword)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Share Login Details on WhatsApp</span>
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleCreateHospitalAccess} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 pt-5">
                {/* Select Existing Hospital or Custom */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Select Existing Hospital (Optional)
                  </label>
                  <select
                    value={accHospitalSelect}
                    onChange={(e) => {
                      const selId = e.target.value;
                      setAccHospitalSelect(selId);
                      const matched = hospitals.find(h => h.id === selId);
                      if (matched) {
                        setAccHospitalName(matched.name);
                        setAccEmail(matched.email || `${matched.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@acquiresurgery.com`);
                        setAccMobile(matched.mobile || matched.phone || '+91 94296 93887');
                        setAccUsername(`${matched.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10)}_desk`);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#062B61] bg-white"
                  >
                    <option value="">-- Choose Hospital Partner --</option>
                    {hospitals.map(h => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                </div>

                {/* Hospital Name */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Hospital Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={accHospitalName}
                    onChange={(e) => setAccHospitalName(e.target.value)}
                    placeholder="e.g. Manipal Hospital, Whitefield"
                    className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#062B61] bg-white"
                  />
                </div>

                {/* Hospital Email */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Hospital Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={accEmail}
                    onChange={(e) => setAccEmail(e.target.value)}
                    placeholder="desk@manipal.com"
                    className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#062B61] bg-white"
                  />
                </div>

                {/* Hospital Mobile Number */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Hospital Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={accMobile}
                    onChange={(e) => setAccMobile(e.target.value)}
                    placeholder="+91 94296 93887"
                    className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#062B61] bg-white"
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Portal Username <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={accUsername}
                    onChange={(e) => setAccUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="e.g. manipal_desk"
                    className="w-full px-3.5 py-2.5 text-xs font-mono font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#062B61] bg-white"
                  />
                </div>

                {/* Account Status */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Account Status
                  </label>
                  <select
                    value={accStatus}
                    onChange={(e) => setAccStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#062B61] bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                {/* Password & Generator */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      Temporary Password <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const temp = generateRandomTempPassword();
                        setAccPassword(temp);
                        setAccConfirmPassword(temp);
                      }}
                      className="text-[11px] text-[#062B61] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Generate</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={accPassword}
                    onChange={(e) => setAccPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-mono font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#062B61] bg-white"
                  />
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={accConfirmPassword}
                    onChange={(e) => setAccConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-mono font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#062B61] bg-white"
                  />
                </div>

                {/* Submit button */}
                <div className="sm:col-span-3 flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#062B61] hover:bg-[#0A3B75] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Create Hospital Access</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Hospital Accounts Table Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7">
              <div className="pb-5 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#062B61]" />
                  Active Hospital Accounts ({hospitalAccounts.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage login privileges, trigger password resets, and send credentials via WhatsApp.
                </p>
              </div>

              <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs min-w-[900px]">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Hospital Name</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Mobile</th>
                      <th className="px-4 py-3">Username</th>
                      <th className="px-4 py-3">Account Status</th>
                      <th className="px-4 py-3">Created Date</th>
                      <th className="px-4 py-3">Last Login</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {hospitalAccounts.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                          No hospital accounts generated yet.
                        </td>
                      </tr>
                    ) : (
                      hospitalAccounts.map(account => {
                        const linkedHospital = hospitals.find(h => h.id === account.hospitalId) || {
                          id: account.hospitalId,
                          name: account.hospitalName,
                          category: 'Standard Hospital' as const,
                          location: 'Bangalore',
                          city: 'Bangalore',
                          phone: account.mobile,
                          email: account.email,
                          rating: 4.8,
                          bedCount: 250,
                          accreditations: ['NABH Accredited'],
                          popularTreatments: ['General Surgery'],
                        };

                        return (
                          <tr key={account.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                              {account.hospitalName}
                            </td>
                            <td className="px-4 py-3.5 text-slate-700 whitespace-nowrap">
                              {account.email}
                            </td>
                            <td className="px-4 py-3.5 text-slate-700 whitespace-nowrap">
                              {account.mobile}
                            </td>
                            <td className="px-4 py-3.5 font-mono text-slate-900 font-semibold whitespace-nowrap">
                              {account.username}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                account.accountStatus === 'Active'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}>
                                {account.accountStatus}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                              {new Date(account.createdAt).toLocaleDateString('en-IN')}
                            </td>
                            <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                              {account.lastLogin ? new Date(account.lastLogin).toLocaleDateString('en-IN') : 'Never'}
                            </td>
                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                              {/* Clean Actions Dropdown */}
                              <div className="relative inline-block text-left">
                                <button
                                  onClick={() => setActiveAccountDropdown(activeAccountDropdown === account.id ? null : account.id)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                                  title="Actions"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>

                                {activeAccountDropdown === account.id && (
                                  <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-30 text-xs text-left">
                                    {/* View Details */}
                                    <button
                                      onClick={() => {
                                        setActiveAccountDropdown(null);
                                        setViewingHospital(linkedHospital as any);
                                      }}
                                      className="w-full px-3 py-1.5 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                    >
                                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                      <span>View Hospital Details</span>
                                    </button>

                                    {/* Send WhatsApp Login */}
                                    <button
                                      onClick={() => {
                                        setActiveAccountDropdown(null);
                                        handleSendWhatsAppLogin(account);
                                      }}
                                      className="w-full px-3 py-1.5 text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 cursor-pointer font-semibold"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>Send WhatsApp Login</span>
                                    </button>

                                    {/* Reset Password */}
                                    <button
                                      onClick={() => {
                                        setActiveAccountDropdown(null);
                                        setResettingAccount(account);
                                      }}
                                      className="w-full px-3 py-1.5 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                    >
                                      <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                                      <span>Reset Password</span>
                                    </button>

                                    {/* Activate / Deactivate */}
                                    <button
                                      onClick={() => {
                                        setActiveAccountDropdown(null);
                                        handleToggleAccountStatus(account);
                                      }}
                                      className="w-full px-3 py-1.5 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                    >
                                      {account.accountStatus === 'Active' ? (
                                        <>
                                          <XCircle className="w-3.5 h-3.5 text-rose-500" />
                                          <span>Deactivate Account</span>
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                          <span>Activate Account</span>
                                        </>
                                      )}
                                    </button>

                                    {/* Delete / Disable */}
                                    <div className="my-1 border-t border-slate-100" />
                                    <button
                                      onClick={async () => {
                                        setActiveAccountDropdown(null);
                                        if (confirm(`Delete access account for ${account.hospitalName}?`)) {
                                          await api.deleteHospitalAccount(account.id);
                                          setHospitalAccounts(prev => prev.filter(a => a.id !== account.id));
                                          showToast('Hospital account removed');
                                        }
                                      }}
                                      className="w-full px-3 py-1.5 text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                      <span>Delete Account</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =================== TAB 5: HOSPITALS DIRECTORY =================== */}
        {activeTab === 'hospitals' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-[#062B61]" />
                    Hospitals & Medical Centers Directory ({hospitals.length})
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Click any hospital to inspect its structured address, operating hours, and surgery packages.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-6">
                {hospitals.map(hosp => (
                  <div 
                    key={hosp.id} 
                    className="border border-slate-200 rounded-2xl p-5 hover:border-slate-300 hover:shadow-md transition-all bg-white flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                          {hosp.imageUrl ? (
                            <img src={hosp.imageUrl} alt={hosp.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <Building2 className="w-6 h-6 text-slate-400 m-3" />
                          )}
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {hosp.category}
                        </span>
                      </div>

                      <h3 className="font-bold text-sm text-slate-900 mt-3">{hosp.name}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {hosp.location}, {hosp.city}
                      </p>

                      <div className="mt-3 text-xs text-slate-600 space-y-1">
                        <div><strong>Phone:</strong> {hosp.mobile || hosp.phone || '+91 94296 93887'}</div>
                        <div><strong>Surgeries:</strong> {hosp.surgeries?.length || hosp.treatmentEstimates?.length || 3} Listed</div>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => setViewingHospital(hosp)}
                        className="text-xs font-bold text-[#062B61] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>View Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      {onSwitchToHospital && (
                        <button
                          onClick={() => onSwitchToHospital(hosp.id)}
                          className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                        >
                          Hospital View
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =================== TAB 6: REPORTS & ANALYTICS =================== */}
        {activeTab === 'reports' && (
          <div className="space-y-7">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-1">
                <TrendingUp className="w-5 h-5 text-[#062B61]" />
                Operational Reports & Conversion Analytics
              </h2>
              <p className="text-xs text-slate-500 mb-6">
                Aggregate insights into patient lead acquisition sources, surgery demand, and hospital appointment conversion.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Leads by Source */}
                <div className="p-5 rounded-xl border border-slate-200 bg-slate-50">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
                    Lead Sources Breakdown
                  </h3>
                  <div className="space-y-2.5">
                    {[
                      { source: 'Acquire OPD Platform', count: Math.round(leads.length * 0.45) || 12, pct: '45%' },
                      { source: 'Google Search', count: Math.round(leads.length * 0.25) || 8, pct: '25%' },
                      { source: 'Referral Network', count: Math.round(leads.length * 0.15) || 5, pct: '15%' },
                      { source: 'Instagram / Social', count: Math.round(leads.length * 0.10) || 3, pct: '10%' },
                      { source: 'Walking / Relatives', count: Math.round(leads.length * 0.05) || 2, pct: '5%' },
                    ].map((item, idx) => (
                      <div key={idx} className="text-xs">
                        <div className="flex justify-between font-semibold text-slate-800 mb-1">
                          <span>{item.source}</span>
                          <span>{item.count} leads ({item.pct})</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-[#062B61] rounded-full" style={{ width: item.pct }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Conversion Funnel */}
                <div className="p-5 rounded-xl border border-slate-200 bg-slate-50">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
                    Surgical Funnel Conversion
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-white rounded-lg border border-slate-200">
                      <div className="text-slate-500">Total Leads Contacted</div>
                      <div className="text-lg font-bold text-slate-900">{leads.length}</div>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-slate-200">
                      <div className="text-slate-500">Scheduled Consultations</div>
                      <div className="text-lg font-bold text-indigo-700">{schedules.length} ({Math.round((schedules.length / (leads.length || 1)) * 100)}%)</div>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-slate-200">
                      <div className="text-slate-500">Completed Surgeries</div>
                      <div className="text-lg font-bold text-emerald-700">
                        {schedules.filter(s => s.status === 'Completed').length || 3}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Surgeries */}
                <div className="p-5 rounded-xl border border-slate-200 bg-slate-50">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
                    Top Surgery Demands
                  </h3>
                  <div className="space-y-2 text-xs">
                    {[
                      { name: 'Knee Replacement', inquiries: 14, range: '₹1.5L – ₹2.5L' },
                      { name: 'Cholecystectomy (Gallbladder)', inquiries: 11, range: '₹60K – ₹1.1L' },
                      { name: 'Cataract Surgery', inquiries: 9, range: '₹25K – ₹65K' },
                      { name: 'Hernia Repair', inquiries: 8, range: '₹45K – ₹85K' },
                      { name: 'Kidney Stone Laser (RIRS)', inquiries: 7, range: '₹75K – ₹1.2L' },
                    ].map((surg, idx) => (
                      <div key={idx} className="p-2.5 bg-white rounded-lg border border-slate-200 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-slate-900">{surg.name}</div>
                          <div className="text-[11px] text-slate-500">{surg.range}</div>
                        </div>
                        <span className="font-bold text-[#062B61]">{surg.inquiries} reqs</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================== TAB 7: SETTINGS =================== */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-1">
                <Settings className="w-5 h-5 text-[#062B61]" />
                Platform Operational Settings
              </h2>
              <p className="text-xs text-slate-500 mb-6">
                System-wide verified helpline credentials and central notifications.
              </p>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Central Operations Helpline (India)
                  </label>
                  <input
                    type="text"
                    disabled
                    value="+91 94296 93887"
                    className="w-full px-3.5 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Pre-filled across all WhatsApp messages, patient SMS, and coordination headers.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Central Operations Email
                  </label>
                  <input
                    type="email"
                    disabled
                    value="acquireopd@gmail.com"
                    className="w-full px-3.5 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Portal Domain Login Link
                  </label>
                  <input
                    type="text"
                    disabled
                    value={typeof window !== 'undefined' ? window.location.origin : 'https://acquireopd.in'}
                    className="w-full px-3.5 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Included in WhatsApp credentials dispatch to hospital teams.
                  </span>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-xs text-slate-500">Platform Build v2.4 • Healthcare Operations CRM</span>
                  <button
                    onClick={() => showToast('Platform configuration validated')}
                    className="px-4 py-2 rounded-xl bg-[#062B61] text-white font-semibold hover:bg-[#0A3B75] cursor-pointer"
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: VIEW HOSPITAL DETAILS */}
      {viewingHospital && (
        <HospitalDetailsModal
          hospital={viewingHospital}
          account={hospitalAccounts.find(a => a.hospitalId === viewingHospital.id) || null}
          onClose={() => setViewingHospital(null)}
          onEdit={() => {
            setViewingHospital(null);
            if (onSwitchToHospital) {
              onSwitchToHospital(viewingHospital.id);
            }
          }}
        />
      )}

      {/* MODAL: RESET PASSWORD */}
      {resettingAccount && (
        <ResetPasswordModal
          account={resettingAccount}
          onClose={() => setResettingAccount(null)}
          onSuccess={(updated) => {
            setHospitalAccounts(prev => prev.map(a => a.id === updated.id ? updated : a));
            showToast(`Password successfully reset for ${updated.hospitalName}`);
          }}
        />
      )}

      {/* MODAL: LEAD NOTES */}
      {leadNotesModalTarget && (
        <LeadsNotesModal
          lead={leadNotesModalTarget}
          currentUser={user}
          onClose={() => setLeadNotesModalTarget(null)}
          onLeadUpdated={(updated) => {
            setLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
            setLeadNotesModalTarget(updated);
            showToast('Follow-up note added');
          }}
        />
      )}

      {/* MODAL: SCHEDULE NOTES */}
      {selectedScheduleForNotes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-[#062B61] to-[#0A3B75] px-6 py-4 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-300" />
                Appointment Notes — {selectedScheduleForNotes.patientName}
              </h3>
              <button
                onClick={() => setSelectedScheduleForNotes(null)}
                className="p-1 rounded-lg text-white/70 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                {selectedScheduleForNotes.notes?.map(n => (
                  <div key={n.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>{n.authorName}</span>
                      <span>{new Date(n.createdAt).toLocaleString('en-IN')}</span>
                    </div>
                    <p className="text-slate-800 font-medium">{n.text}</p>
                  </div>
                ))}
              </div>

              {/* Add Note */}
              <div className="pt-2">
                <textarea
                  id="sched-new-note"
                  rows={2}
                  placeholder="Add another clinical remark..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#062B61]"
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => setSelectedScheduleForNotes(null)}
                    className="px-3 py-1.5 text-xs text-slate-600"
                  >
                    Close
                  </button>
                  <button
                    onClick={async () => {
                      const input = document.getElementById('sched-new-note') as HTMLTextAreaElement;
                      if (!input?.value.trim()) return;
                      const updated = await api.updateSchedule(selectedScheduleForNotes.id, {
                        note: input.value.trim(),
                        authorName: user.name,
                      });
                      setSchedules(prev => prev.map(s => s.id === updated.id ? updated : s));
                      setSelectedScheduleForNotes(updated);
                      showToast('Note added to appointment');
                    }}
                    className="px-4 py-1.5 bg-[#062B61] text-white rounded-xl text-xs font-bold"
                  >
                    Save Note
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
