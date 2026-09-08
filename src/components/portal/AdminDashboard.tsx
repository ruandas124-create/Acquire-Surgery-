import React, { useState, useEffect } from 'react';
import { 
  Lead, 
  Hospital, 
  CategoryInfo, 
  TreatmentInfo, 
  LeadStatus, 
  HospitalCategory, 
  AuthUser 
} from '../../types';
import { api } from '../../services/api';
import { 
  Users, 
  Building2, 
  Layers, 
  Activity, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  CheckCircle2, 
  Clock, 
  Phone, 
  MessageSquare, 
  UserCheck, 
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
  Calendar,
  Sparkles
} from 'lucide-react';

interface AdminDashboardProps {
  user: AuthUser;
  onLogout: () => void;
  onClose: () => void;
  onSwitchToHospital?: (hospitalId: string) => void;
}

const REPRESENTATIVES = [
  'Unassigned',
  'Dr. Priya Nair (Senior Coordinator)',
  'Rahul Sharma (Orthopedic Specialist)',
  'Kavitha R. (Cardiac & Laparoscopic)',
  'Anand Verma (Patient Navigator)'
];

const LEAD_STATUSES: LeadStatus[] = [
  'New',
  'Contacted',
  'Assistance in Progress',
  'Hospital Selected',
  'Closed'
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  user,
  onLogout,
  onClose,
  onSwitchToHospital
}) => {
  const [activeTab, setActiveTab] = useState<'leads' | 'hospitals' | 'categories' | 'treatments'>('leads');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [treatments, setTreatments] = useState<TreatmentInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Leads filter
  const [leadStatusFilter, setLeadStatusFilter] = useState<string>('All');
  const [leadSearch, setLeadSearch] = useState('');

  // Selected lead for note/status modal
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [newNote, setNewNote] = useState('');

  // Hospital modal
  const [editingHospital, setEditingHospital] = useState<Partial<Hospital> | null>(null);
  const [isHospitalModalOpen, setIsHospitalModalOpen] = useState(false);

  // Category editing state
  const [editingCategory, setEditingCategory] = useState<CategoryInfo | null>(null);

  // Treatment modal
  const [editingTreatment, setEditingTreatment] = useState<Partial<TreatmentInfo> | null>(null);
  const [isTreatmentModalOpen, setIsTreatmentModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [leadsData, hospData, catData, treatData] = await Promise.all([
        api.getLeads(),
        api.getHospitals(),
        api.getCategories(),
        api.getTreatments(),
      ]);
      setLeads(leadsData);
      setHospitals(hospData);
      setCategories(catData);
      setTreatments(treatData);
    } catch (err) {
      console.error('Error loading admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update lead status
  const handleUpdateLeadStatus = async (leadId: string, status: LeadStatus) => {
    try {
      const updated = await api.updateLead(leadId, { status });
      setLeads(prev => prev.map(l => l.id === leadId ? updated : l));
      if (selectedLead?.id === leadId) setSelectedLead(updated);
    } catch {
      alert('Failed to update lead status');
    }
  };

  // Update representative
  const handleAssignRep = async (leadId: string, rep: string) => {
    try {
      const updated = await api.updateLead(leadId, { assignedRep: rep });
      setLeads(prev => prev.map(l => l.id === leadId ? updated : l));
      if (selectedLead?.id === leadId) setSelectedLead(updated);
    } catch {
      alert('Failed to assign representative');
    }
  };

  // Add note to lead
  const handleAddNote = async () => {
    if (!selectedLead || !newNote.trim()) return;
    try {
      const updated = await api.updateLead(selectedLead.id, { note: newNote.trim() });
      setLeads(prev => prev.map(l => l.id === selectedLead.id ? updated : l));
      setSelectedLead(updated);
      setNewNote('');
    } catch {
      alert('Failed to add note');
    }
  };

  // Save hospital
  const handleSaveHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHospital?.name) return;
    try {
      if (editingHospital.id) {
        const updated = await api.updateHospital(editingHospital.id, editingHospital);
        setHospitals(prev => prev.map(h => h.id === updated.id ? updated : h));
      } else {
        const created = await api.addHospital(editingHospital);
        setHospitals(prev => [created, ...prev]);
      }
      setIsHospitalModalOpen(false);
      setEditingHospital(null);
    } catch {
      alert('Failed to save hospital');
    }
  };

  // Delete hospital
  const handleDeleteHospital = async (id: string) => {
    if (!confirm('Are you sure you want to delete this hospital?')) return;
    try {
      await api.deleteHospital(id);
      setHospitals(prev => prev.filter(h => h.id !== id));
    } catch {
      alert('Failed to delete hospital');
    }
  };

  // Save Category description
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    try {
      const updated = await api.updateCategory(editingCategory.id, editingCategory);
      setCategories(prev => prev.map(c => c.id === updated.id ? updated : c));
      setEditingCategory(null);
      alert('Hospital category description updated successfully!');
    } catch {
      alert('Failed to update category');
    }
  };

  // Filtered leads
  const filteredLeads = leads.filter(l => {
    const matchesStatus = leadStatusFilter === 'All' || l.status === leadStatusFilter;
    const matchesSearch = l.name.toLowerCase().includes(leadSearch.toLowerCase()) ||
                          l.mobile.toLowerCase().includes(leadSearch.toLowerCase()) ||
                          l.treatment.toLowerCase().includes(leadSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div id="acquire-admin-dashboard" className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Top Banner & User Session Bar */}
      <div className="bg-slate-900 text-white p-6 sm:p-7 rounded-3xl mb-8 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Acquire SURGERY • Master Administrator Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Platform Healthcare Operations &amp; Inquiries
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Track Bangalore patient search requests, manage verified hospital profiles, configure neutral category descriptions, and oversee surgical package estimates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Logged in User Pill */}
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/10 border border-white/15 text-left">
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center text-xs shadow-inner">
                VM
              </div>
              <div className="text-xs">
                <span className="font-bold block text-white">{user.name}</span>
                <span className="text-[10px] text-cyan-300 block">{user.title || 'Super Administrator'}</span>
              </div>
            </div>

            {/* Switch to Hospital Dashboard quick button */}
            {onSwitchToHospital && (
              <button
                onClick={() => onSwitchToHospital('hosp-manipal-oar')}
                className="px-3.5 py-2 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Switch view to simulate Hospital Partner Dashboard"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">View as</span> Hospital Partner
              </button>
            )}

            {/* Refresh */}
            <button
              onClick={loadData}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Sign Out of Portal"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>

            {/* Exit to Public Website */}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white text-slate-900 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Exit to Website
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Total Inquiries</span>
            <Users className="w-4 h-4 text-[#062B61]" />
          </div>
          <span className="text-2xl font-black text-[#062B61] block">{leads.length}</span>
          <span className="text-[11px] text-emerald-600 font-semibold">{leads.filter(l => l.status === 'New').length} New Pending</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Bangalore Hospitals</span>
            <Building2 className="w-4 h-4 text-slate-600" />
          </div>
          <span className="text-2xl font-black text-slate-900 block">{hospitals.length}</span>
          <span className="text-[11px] text-slate-400 font-semibold">Across All 4 Categories</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">In-Progress Assistance</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-2xl font-black text-amber-600 block">
            {leads.filter(l => l.status === 'Assistance in Progress' || l.status === 'Contacted').length}
          </span>
          <span className="text-[11px] text-amber-700 font-semibold">Assigned to Navigators</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Hospitals Selected</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-black text-emerald-700 block">
            {leads.filter(l => l.status === 'Hospital Selected' || l.status === 'Closed').length}
          </span>
          <span className="text-[11px] text-emerald-700 font-semibold">Treatment Decisions Made</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 mb-6 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('leads')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'leads'
              ? 'border-b-2 border-[#062B61] text-[#062B61] bg-blue-50/50'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Patient Requests &amp; Leads ({leads.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('hospitals')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'hospitals'
              ? 'border-b-2 border-[#062B61] text-[#062B61] bg-blue-50/50'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Bangalore Hospitals ({hospitals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'categories'
              ? 'border-b-2 border-[#062B61] text-[#062B61] bg-blue-50/50'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Category Guidance Rules ({categories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('treatments')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'treatments'
              ? 'border-b-2 border-[#062B61] text-[#062B61] bg-blue-50/50'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Surgical Procedures &amp; Packages ({treatments.length})</span>
        </button>
      </div>

      {/* TAB 1: LEADS MANAGEMENT */}
      {activeTab === 'leads' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search patient name, mobile, or surgery requirement..."
                  value={leadSearch}
                  onChange={(e) => setLeadSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500 font-medium">Status:</span>
              <select
                value={leadStatusFilter}
                onChange={(e) => setLeadStatusFilter(e.target.value)}
                className="text-xs sm:text-sm rounded-xl border border-slate-200 py-1.5 px-3 bg-white font-medium text-slate-700"
              >
                <option value="All">All Inquiries ({leads.length})</option>
                {LEAD_STATUSES.map(s => (
                  <option key={s} value={s}>
                    {s} ({leads.filter(l => l.status === s).length})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Leads Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Patient &amp; Contact</th>
                    <th className="py-3.5 px-4">Requested Surgery</th>
                    <th className="py-3.5 px-4">Budget Bracket</th>
                    <th className="py-3.5 px-4">Matched Options</th>
                    <th className="py-3.5 px-4">Assigned Coordinator</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No patient leads matching the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{lead.name}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" />
                            <span>{lead.mobile}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(lead.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-xs">
                            {lead.treatment}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-medium text-slate-700">
                            {lead.budget}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="text-xs font-bold text-blue-700">
                            {lead.matchedHospitalCount || lead.matchedHospitalIds?.length || 0} hospitals
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <select
                            value={lead.assignedRep || 'Unassigned'}
                            onChange={(e) => handleAssignRep(lead.id, e.target.value)}
                            className="text-xs rounded-lg border border-slate-200 py-1 px-2 bg-white text-slate-700 font-medium"
                          >
                            {REPRESENTATIVES.map(r => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        </td>

                        <td className="py-3.5 px-4">
                          <select
                            value={lead.status}
                            onChange={(e) => handleUpdateLeadStatus(lead.id, e.target.value as LeadStatus)}
                            className={`text-xs font-bold rounded-lg border py-1 px-2.5 ${
                              lead.status === 'New'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : lead.status === 'Contacted'
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : lead.status === 'Assistance in Progress'
                                ? 'bg-purple-50 text-purple-800 border-purple-200'
                                : lead.status === 'Hospital Selected'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {LEAD_STATUSES.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedLead(lead)}
                            className="text-xs font-bold text-[#062B61] hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                          >
                            View &amp; Notes
                          </button>
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

      {/* TAB 2: HOSPITALS DIRECTORY */}
      {activeTab === 'hospitals' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Registered Bangalore Hospitals</h2>
              <p className="text-xs text-slate-500">Configure bed capacities, categories, specialties, and package estimates.</p>
            </div>
            <button
              onClick={() => {
                setEditingHospital({
                  name: '',
                  category: 'Standard Hospital',
                  location: 'Bangalore',
                  city: 'Bangalore',
                  rating: 4.5,
                  reviewCount: 100,
                  establishedYear: 2010,
                  bedCount: 150,
                  specialties: ['Orthopedics', 'General Surgery'],
                  facilities: ['NABH Accredited', '24x7 Emergency'],
                  accreditations: ['NABH'],
                  description: '',
                  imageUrl: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=800&q=80',
                  phone: '+91 80 0000 0000',
                  address: 'Bangalore, Karnataka',
                  insuranceCashless: ['Star Health', 'HDFC ERGO'],
                  treatmentEstimates: []
                });
                setIsHospitalModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#062B61] text-white text-xs font-bold rounded-xl hover:bg-[#0A3B75] transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Hospital</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hospitals.map((hosp) => (
              <div key={hosp.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
                <div>
                  <div className="h-40 bg-slate-100 relative overflow-hidden">
                    <img 
                      src={hosp.imageUrl} 
                      alt={hosp.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                    <span className="absolute top-3 left-3 text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-xs text-slate-900">
                      {hosp.category}
                    </span>
                    <span className="absolute bottom-3 right-3 text-[11px] font-bold px-2 py-0.5 rounded bg-black/70 text-white">
                      ★ {hosp.rating}
                    </span>
                  </div>

                  <div className="p-4 space-y-2">
                    <h3 className="font-bold text-slate-900 text-sm">{hosp.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{hosp.location}, {hosp.city}</span>
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-600 pt-1">
                      <span className="font-semibold">{hosp.bedCount} Beds</span>
                      <span>•</span>
                      <span>Est. {hosp.establishedYear}</span>
                    </div>

                    <div className="pt-2">
                      <span className="text-[11px] text-slate-400 block mb-1">Accreditations:</span>
                      <div className="flex flex-wrap gap-1">
                        {hosp.accreditations?.map(a => (
                          <span key={a} className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0 border-t border-slate-100 mt-3 flex items-center justify-between gap-2">
                  {onSwitchToHospital && (
                    <button
                      onClick={() => onSwitchToHospital(hosp.id)}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                      title="Open Hospital Partner Dashboard for this hospital"
                    >
                      <Building2 className="w-3 h-3" />
                      <span>Partner View</span>
                    </button>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingHospital(hosp);
                        setIsHospitalModalOpen(true);
                      }}
                      className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      title="Edit Hospital Profile"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteHospital(hosp.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Hospital"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CATEGORIES GUIDANCE */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-xs text-blue-900 leading-relaxed">
            <strong>Neutral &amp; Objective Descriptions:</strong> Category guidance helps patients understand hospital infrastructure without disparaging any tier. Administrators can adjust the descriptions below.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categories.map((cat) => (
              <div key={cat.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${cat.badgeBg} ${cat.badgeBorder} border`}>
                    {cat.name}
                  </span>
                  <button
                    onClick={() => setEditingCategory(cat)}
                    className="text-xs font-bold text-[#062B61] hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Guidance Text</span>
                  </button>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-700 block mb-1">Public Summary Tag:</span>
                  <p className="text-xs text-slate-600">{cat.shortDesc}</p>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-700 block mb-1">Detailed Explanation:</span>
                  <p className="text-xs text-slate-600 leading-relaxed">{cat.fullDesc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: TREATMENTS & PACKAGES */}
      {activeTab === 'treatments' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Bangalore Surgical Procedures &amp; Price Benchmarks</h2>
              <p className="text-xs text-slate-500">Benchmark costs across accredited hospitals in Bangalore.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {treatments.map((t) => (
              <div key={t.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{t.category}</span>
                    <h3 className="font-bold text-slate-900 text-base">{t.name}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block font-medium">Expected Cost Range</span>
                    <span className="font-extrabold text-[#062B61] text-sm">
                      ₹{(t.averageBangaloreMinCost / 1000).toFixed(0)}k – ₹{(t.averageBangaloreMaxCost / 100000).toFixed(1)} Lakh
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{t.description}</p>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Typical Stay:</span>
                    <span className="font-semibold text-slate-700">{t.typicalStay}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Recovery Period:</span>
                    <span className="font-semibold text-slate-700">{t.recoveryDays}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: LEAD DETAIL & NOTES */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">{selectedLead.name}</h3>
                <span className="text-xs text-slate-500">Inquiry ID: {selectedLead.id}</span>
              </div>
              <button 
                onClick={() => setSelectedLead(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="text-slate-400 block mb-0.5">Mobile Contact</span>
                <span className="font-bold text-slate-800">{selectedLead.mobile}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="text-slate-400 block mb-0.5">Requested Surgery</span>
                <span className="font-bold text-slate-800">{selectedLead.treatment}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="text-slate-400 block mb-0.5">Indicated Budget</span>
                <span className="font-bold text-slate-800">{selectedLead.budget}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="text-slate-400 block mb-0.5">Location</span>
                <span className="font-bold text-slate-800">{selectedLead.city}</span>
              </div>
            </div>

            {/* Existing Notes */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800 block">Coordinator Activity &amp; Notes:</span>
              <div className="max-h-32 overflow-y-auto space-y-1.5 p-2 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                {selectedLead.notes && selectedLead.notes.length > 0 ? (
                  selectedLead.notes.map((note, idx) => (
                    <div key={idx} className="p-2 rounded bg-white text-slate-700 shadow-2xs">
                      {note}
                    </div>
                  ))
                ) : (
                  <span className="text-slate-400 italic text-[11px]">No coordinator notes logged yet.</span>
                )}
              </div>
            </div>

            {/* Add Note Input */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a new update note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddNote}
                  className="px-3 py-2 bg-[#062B61] text-white rounded-xl text-xs font-bold hover:bg-[#0A3B75] cursor-pointer"
                >
                  Save Note
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLead(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT/ADD HOSPITAL */}
      {isHospitalModalOpen && editingHospital && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900">
                {editingHospital.id ? 'Edit Hospital Profile' : 'Add New Hospital'}
              </h3>
              <button 
                onClick={() => setIsHospitalModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHospital} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Hospital Name</label>
                <input
                  type="text"
                  required
                  value={editingHospital.name || ''}
                  onChange={(e) => setEditingHospital({ ...editingHospital, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={editingHospital.category}
                    onChange={(e) => setEditingHospital({ ...editingHospital, category: e.target.value as HospitalCategory })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Premium Hospital">Premium Hospital</option>
                    <option value="Standard Hospital">Standard Hospital</option>
                    <option value="Budget-Friendly Hospital">Budget-Friendly Hospital</option>
                    <option value="Specialty Hospital">Specialty Hospital</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Bangalore Area / Zone</label>
                  <input
                    type="text"
                    required
                    value={editingHospital.location || ''}
                    onChange={(e) => setEditingHospital({ ...editingHospital, location: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Total Beds</label>
                  <input
                    type="number"
                    value={editingHospital.bedCount || 0}
                    onChange={(e) => setEditingHospital({ ...editingHospital, bedCount: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Rating (1-5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={editingHospital.rating || 4.5}
                    onChange={(e) => setEditingHospital({ ...editingHospital, rating: parseFloat(e.target.value) || 4.5 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Est. Year</label>
                  <input
                    type="number"
                    value={editingHospital.establishedYear || 2000}
                    onChange={(e) => setEditingHospital({ ...editingHospital, establishedYear: parseInt(e.target.value, 10) || 2000 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editingHospital.phone || ''}
                  onChange={(e) => setEditingHospital({ ...editingHospital, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Address</label>
                <input
                  type="text"
                  value={editingHospital.address || ''}
                  onChange={(e) => setEditingHospital({ ...editingHospital, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Specialties (comma-separated)</label>
                <input
                  type="text"
                  value={editingHospital.specialties?.join(', ') || ''}
                  onChange={(e) => setEditingHospital({ 
                    ...editingHospital, 
                    specialties: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Accreditations (comma-separated, e.g. NABH, NABL)</label>
                <input
                  type="text"
                  value={editingHospital.accreditations?.join(', ') || ''}
                  onChange={(e) => setEditingHospital({ 
                    ...editingHospital, 
                    accreditations: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Hospital Description</label>
                <textarea
                  rows={2}
                  value={editingHospital.description || ''}
                  onChange={(e) => setEditingHospital({ ...editingHospital, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsHospitalModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#062B61] hover:bg-[#0A3B75] text-white rounded-xl font-bold cursor-pointer"
                >
                  Save Hospital
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT CATEGORY */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900">
                Edit Guidance: {editingCategory.name}
              </h3>
              <button 
                onClick={() => setEditingCategory(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Short Description (Badge Tagline)</label>
                <input
                  type="text"
                  required
                  value={editingCategory.shortDesc}
                  onChange={(e) => setEditingCategory({ ...editingCategory, shortDesc: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Detailed Explanation (Objective standard)</label>
                <textarea
                  rows={4}
                  required
                  value={editingCategory.fullDesc}
                  onChange={(e) => setEditingCategory({ ...editingCategory, fullDesc: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#062B61] hover:bg-[#0A3B75] text-white rounded-xl font-bold cursor-pointer"
                >
                  Save Category Guidance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
