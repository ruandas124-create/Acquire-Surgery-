import React, { useState, useEffect } from 'react';
import { 
  AuthUser, 
  Hospital, 
  Lead, 
  TreatmentEstimate, 
  HospitalCapacityStatus 
} from '../../types';
import { api } from '../../services/api';
import { 
  Building2, 
  Users, 
  Bed, 
  Activity, 
  Phone, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  FileText, 
  Edit3, 
  Plus, 
  Save, 
  X, 
  IndianRupee, 
  AlertCircle, 
  ShieldCheck, 
  LogOut, 
  RefreshCw, 
  Check, 
  ArrowRight,
  ExternalLink,
  HeartPulse,
  Award,
  MapPin
} from 'lucide-react';

interface HospitalDashboardProps {
  user: AuthUser;
  hospitals: Hospital[];
  onLogout: () => void;
  onClose: () => void;
  onSwitchHospital: (hospitalId: string) => void;
}

export const HospitalDashboard: React.FC<HospitalDashboardProps> = ({
  user,
  hospitals,
  onLogout,
  onClose,
  onSwitchHospital,
}) => {
  // Current hospital
  const currentHospitalId = user.hospitalId || hospitals[0]?.id || 'hosp-manipal-oar';
  const hospital = hospitals.find(h => h.id === currentHospitalId) || hospitals[0];

  const [activeTab, setActiveTab] = useState<'leads' | 'profile' | 'packages' | 'capacity'>('leads');
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtered leads matching this hospital's specialties or preferred hospital
  const [leadStatusFilter, setLeadStatusFilter] = useState<string>('All');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [newCoordinatorNote, setNewCoordinatorNote] = useState('');

  // Hospital profile editing
  const [editingProfile, setEditingProfile] = useState<Hospital | null>(null);
  const [isProfileSaved, setIsProfileSaved] = useState(false);

  // Hospital package editing
  const [estimates, setEstimates] = useState<TreatmentEstimate[]>([]);
  const [editingEstimate, setEditingEstimate] = useState<TreatmentEstimate | null>(null);
  const [newProcedureName, setNewProcedureName] = useState('');
  const [newMinCost, setNewMinCost] = useState('');
  const [newMaxCost, setNewMaxCost] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [isAddingProcedure, setIsAddingProcedure] = useState(false);

  // Capacity live status
  const [capacity, setCapacity] = useState<HospitalCapacityStatus>({
    icuStatus: 'Available',
    generalBedsAvailable: Math.round((hospital?.bedCount || 200) * 0.15),
    emergencyActive: true,
    acceptingReferrals: true,
    tpaDeskOpen: true,
  });
  const [capacitySaved, setCapacitySaved] = useState(false);

  useEffect(() => {
    if (hospital) {
      setEditingProfile(hospital);
      setEstimates(hospital.treatmentEstimates || []);
    }
  }, [hospital]);

  const loadData = async () => {
    setLoading(true);
    try {
      const leadsData = await api.getLeads();
      setAllLeads(leadsData);
    } catch (err) {
      console.error('Error fetching leads for hospital portal', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentHospitalId]);

  // Relevant leads for this hospital:
  // Matches if:
  // 1. Matched hospital IDs includes this hospital
  // 2. OR preferredHospitalId equals this hospital
  // 3. OR this hospital provides treatment matching the lead's treatment
  const relevantLeads = allLeads.filter(lead => {
    if (!hospital) return true;
    if (lead.preferredHospitalId === hospital.id) return true;
    if (lead.matchedHospitalIds && lead.matchedHospitalIds.includes(hospital.id)) return true;
    
    // Check if hospital specialties or treatment estimates match
    const leadTreatment = (lead.treatment || '').toLowerCase();
    const hasSpecialty = hospital.specialties?.some(s => leadTreatment.includes(s.toLowerCase()) || s.toLowerCase().includes(leadTreatment));
    const hasEstimate = hospital.treatmentEstimates?.some(t => t.treatmentName.toLowerCase().includes(leadTreatment));
    return hasSpecialty || hasEstimate;
  });

  const filteredLeads = relevantLeads.filter(l => {
    if (leadStatusFilter === 'All') return true;
    return l.status === leadStatusFilter;
  });

  // Handle coordinator adding note to patient
  const handleAddHospitalNote = async () => {
    if (!selectedLead || !newCoordinatorNote.trim()) return;
    const taggedNote = `[${hospital?.name || 'Hospital Coordinator'}]: ${newCoordinatorNote.trim()} (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
    try {
      const updated = await api.updateLead(selectedLead.id, { note: taggedNote });
      setAllLeads(prev => prev.map(l => l.id === selectedLead.id ? updated : l));
      setSelectedLead(updated);
      setNewCoordinatorNote('');
    } catch {
      alert('Failed to log hospital coordinator note');
    }
  };

  // Update lead status from hospital desk
  const handleUpdateLeadStatus = async (leadId: string, status: any) => {
    try {
      const updated = await api.updateLead(leadId, { status });
      setAllLeads(prev => prev.map(l => l.id === leadId ? updated : l));
      if (selectedLead?.id === leadId) setSelectedLead(updated);
    } catch {
      alert('Failed to update inquiry status');
    }
  };

  // Save hospital profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile || !hospital) return;
    try {
      await api.updateHospital(hospital.id, editingProfile);
      setIsProfileSaved(true);
      setTimeout(() => setIsProfileSaved(false), 3000);
    } catch {
      alert('Failed to update hospital profile');
    }
  };

  // Save procedure packages
  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProcedureName.trim() || !newMinCost || !newMaxCost || !hospital) return;
    const newEst: TreatmentEstimate = {
      treatmentName: newProcedureName.trim(),
      minCost: parseInt(newMinCost, 10),
      maxCost: parseInt(newMaxCost, 10),
      notes: newNotes.trim() || undefined,
    };
    const updatedList = [...estimates, newEst];
    setEstimates(updatedList);
    try {
      await api.updateHospital(hospital.id, { treatmentEstimates: updatedList });
      setIsAddingProcedure(false);
      setNewProcedureName('');
      setNewMinCost('');
      setNewMaxCost('');
      setNewNotes('');
    } catch {
      alert('Failed to add package');
    }
  };

  const handleDeletePackage = async (procName: string) => {
    if (!hospital || !confirm(`Remove package estimate for ${procName}?`)) return;
    const updatedList = estimates.filter(e => e.treatmentName !== procName);
    setEstimates(updatedList);
    try {
      await api.updateHospital(hospital.id, { treatmentEstimates: updatedList });
    } catch {
      alert('Failed to remove package');
    }
  };

  // Save capacity status
  const handleSaveCapacity = () => {
    setCapacitySaved(true);
    setTimeout(() => setCapacitySaved(false), 3000);
  };

  if (!hospital) {
    return (
      <div className="py-12 text-center text-slate-500">
        No hospital found. Please select a hospital from the portal login.
      </div>
    );
  }

  return (
    <div id="acquire-hospital-dashboard" className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Top Banner with Hospital Identity */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 sm:p-7 rounded-3xl mb-8 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Hospital Partner Portal
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-white/10 text-cyan-200 font-medium">
                {hospital.category}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 font-bold">
                ★ {hospital.rating} Rating
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <span>{hospital.name}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{hospital.address || `${hospital.location}, Bangalore`}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Hospital Switcher for Demonstration & Testing */}
            <div className="relative">
              <label className="text-[10px] uppercase font-bold text-slate-300 block mb-1">
                Switch Hospital Desk:
              </label>
              <select
                value={hospital.id}
                onChange={(e) => onSwitchHospital(e.target.value)}
                className="bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-bold py-1.5 px-3 rounded-xl focus:ring-2 focus:ring-emerald-400 transition-colors cursor-pointer"
              >
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id} className="text-slate-900 bg-white">
                    {h.name} ({h.location})
                  </option>
                ))}
              </select>
            </div>

            {/* Coordinator Badge */}
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/10 border border-white/15 text-left">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shadow-inner">
                {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
              <div className="text-xs">
                <span className="font-bold block text-white">{user.name}</span>
                <span className="text-[10px] text-emerald-300 block">{user.title || 'Patient Desk Coordinator'}</span>
              </div>
            </div>

            {/* Refresh */}
            <button
              onClick={loadData}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Refresh Inquiries"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Sign Out of Hospital Desk"
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

        {/* Real-time Status Badges Bar */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-300">ICU Capacity:</span>
            <span className={`font-bold px-2 py-0.5 rounded-md ${
              capacity.icuStatus === 'Available' ? 'bg-emerald-400/20 text-emerald-300' : 'bg-amber-400/20 text-amber-300'
            }`}>
              {capacity.icuStatus} ({Math.round((hospital.bedCount || 200) * 0.1)} ICU Beds)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-300">Emergency &amp; Trauma:</span>
            <span className="font-bold text-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              24x7 Operational
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-300">Cashless Insurance TPA Desk:</span>
            <span className="font-bold text-cyan-300 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Active ({hospital.insuranceCashless?.length || 5}+ Insurers)
            </span>
          </div>
        </div>
      </div>

      {/* Hospital Metrics Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Referred Patient Leads</span>
            <Users className="w-4 h-4 text-emerald-700" />
          </div>
          <span className="text-2xl font-black text-emerald-800 block">{relevantLeads.length}</span>
          <span className="text-[11px] text-slate-500 font-semibold">
            {relevantLeads.filter(l => l.status === 'New').length} pending coordinator response
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Consultations in Progress</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-2xl font-black text-[#062B61] block">
            {relevantLeads.filter(l => l.status === 'Assistance in Progress' || l.status === 'Contacted').length}
          </span>
          <span className="text-[11px] text-blue-700 font-semibold">Scheduled at this hospital</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Total Bed Strength</span>
            <Bed className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-2xl font-black text-slate-900 block">{hospital.bedCount}</span>
          <span className="text-[11px] text-purple-700 font-semibold">Registered inpatient capacity</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Surgical Packages Listed</span>
            <IndianRupee className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-2xl font-black text-amber-700 block">{estimates.length}</span>
          <span className="text-[11px] text-slate-500 font-semibold">Transparent procedure packages</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 mb-6 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('leads')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'leads'
              ? 'border-b-2 border-emerald-700 text-emerald-800 bg-emerald-50/50'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Patient Referrals &amp; Inquiries ({relevantLeads.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'profile'
              ? 'border-b-2 border-emerald-700 text-emerald-800 bg-emerald-50/50'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Hospital Profile &amp; Contact Info</span>
        </button>

        <button
          onClick={() => setActiveTab('packages')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'packages'
              ? 'border-b-2 border-emerald-700 text-emerald-800 bg-emerald-50/50'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <IndianRupee className="w-4 h-4" />
          <span>Surgery Packages &amp; Ward Rates ({estimates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('capacity')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'capacity'
              ? 'border-b-2 border-emerald-700 text-emerald-800 bg-emerald-50/50'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <HeartPulse className="w-4 h-4" />
          <span>Live Bed &amp; Department Status</span>
        </button>
      </div>

      {/* TAB 1: PATIENT LEADS RELEVANT TO THIS HOSPITAL */}
      {activeTab === 'leads' && (
        <div className="space-y-6">
          <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <strong>Hospital Coordination Desk:</strong> Showing patient inquiries in Bangalore seeking procedures performed at {hospital.name}. You can acknowledge patient requests, record OPD consultation appointments, and add coordinator notes.
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-slate-500 font-medium">Filter Status:</span>
              <select
                value={leadStatusFilter}
                onChange={(e) => setLeadStatusFilter(e.target.value)}
                className="bg-white border border-emerald-200 rounded-lg px-2.5 py-1 text-xs font-bold text-emerald-900"
              >
                <option value="All">All Referrals ({relevantLeads.length})</option>
                <option value="New">New Unattended</option>
                <option value="Contacted">Contacted</option>
                <option value="Assistance in Progress">Consultation in Progress</option>
                <option value="Hospital Selected">Selected Our Hospital</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Patient Information</th>
                    <th className="py-3.5 px-4">Required Surgery</th>
                    <th className="py-3.5 px-4">Patient Budget</th>
                    <th className="py-3.5 px-4">Date Inquired</th>
                    <th className="py-3.5 px-4">Hospital Desk Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No patient referrals currently under this status filter.
                      </td>
                    </tr>
                  ) : (
                    filteredLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{lead.name}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{lead.mobile}</span>
                          </div>
                          {lead.preferredHospitalId === hospital.id && (
                            <span className="inline-block text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full mt-1">
                              Directly Selected {hospital.name}
                            </span>
                          )}
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

                        <td className="py-3.5 px-4 text-slate-500 text-xs">
                          {new Date(lead.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>

                        <td className="py-3.5 px-4">
                          <select
                            value={lead.status}
                            onChange={(e) => handleUpdateLeadStatus(lead.id, e.target.value)}
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
                            <option value="New">New Unattended</option>
                            <option value="Contacted">Contacted by Hospital</option>
                            <option value="Assistance in Progress">OPD / Estimate in Progress</option>
                            <option value="Hospital Selected">Admission Confirmed</option>
                            <option value="Closed">Discharged / Closed</option>
                          </select>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={`tel:${lead.mobile}`}
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                              title="Call Patient Directly"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                            <button
                              onClick={() => setSelectedLead(lead)}
                              className="text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-lg transition-colors cursor-pointer"
                            >
                              Details &amp; Notes
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

      {/* TAB 2: HOSPITAL PROFILE & CONTACT */}
      {activeTab === 'profile' && editingProfile && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs max-w-4xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Hospital Institutional Profile</h2>
              <p className="text-xs text-slate-500">Update verified hospital details, emergency contact numbers, and bed capacities.</p>
            </div>
            {isProfileSaved && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1 animate-fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Profile updated successfully!
              </span>
            )}
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Official Hospital Name</label>
                <input
                  type="text"
                  value={editingProfile.name || ''}
                  onChange={(e) => setEditingProfile({ ...editingProfile, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Location / Zone in Bangalore</label>
                <input
                  type="text"
                  value={editingProfile.location || ''}
                  onChange={(e) => setEditingProfile({ ...editingProfile, location: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Full Postal Address &amp; Landmarks</label>
              <input
                type="text"
                value={editingProfile.address || ''}
                onChange={(e) => setEditingProfile({ ...editingProfile, address: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Hospital Emergency Helpline</label>
                <input
                  type="text"
                  value={editingProfile.phone || ''}
                  onChange={(e) => setEditingProfile({ ...editingProfile, phone: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Total Inpatient Beds</label>
                <input
                  type="number"
                  value={editingProfile.bedCount || 0}
                  onChange={(e) => setEditingProfile({ ...editingProfile, bedCount: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Established Year</label>
                <input
                  type="number"
                  value={editingProfile.establishedYear || 2000}
                  onChange={(e) => setEditingProfile({ ...editingProfile, establishedYear: parseInt(e.target.value, 10) || 2000 })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Key Specialties Offered (comma separated)</label>
              <input
                type="text"
                value={editingProfile.specialties?.join(', ') || ''}
                onChange={(e) => setEditingProfile({
                  ...editingProfile,
                  specialties: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Hospital Accreditations (e.g. NABH, NABL, ISO)</label>
              <input
                type="text"
                value={editingProfile.accreditations?.join(', ') || ''}
                onChange={(e) => setEditingProfile({
                  ...editingProfile,
                  accreditations: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Approved Cashless Insurance &amp; TPAs</label>
              <input
                type="text"
                value={editingProfile.insuranceCashless?.join(', ') || ''}
                onChange={(e) => setEditingProfile({
                  ...editingProfile,
                  insuranceCashless: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Hospital Profile &amp; Clinical Overview</label>
              <textarea
                rows={3}
                value={editingProfile.description || ''}
                onChange={(e) => setEditingProfile({ ...editingProfile, description: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm transition-colors shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Hospital Profile Changes</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: SURGICAL PACKAGES & PRICING */}
      {activeTab === 'packages' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Surgical Procedure Packages ({hospital.name})
              </h2>
              <p className="text-xs text-slate-500">
                Transparent package estimates shown to Bangalore patients during their healthcare search.
              </p>
            </div>

            <button
              onClick={() => setIsAddingProcedure(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 text-white text-xs font-bold rounded-xl hover:bg-emerald-800 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Procedure Package</span>
            </button>
          </div>

          {/* Add Procedure Form Modal */}
          {isAddingProcedure && (
            <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-900 text-sm">Add New Surgery Package Estimate</h3>
                <button onClick={() => setIsAddingProcedure(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSavePackage} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Procedure Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Gallbladder Laparoscopic"
                    value={newProcedureName}
                    onChange={(e) => setNewProcedureName(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Min Package (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g., 85000"
                    value={newMinCost}
                    onChange={(e) => setNewMinCost(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Max Package (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g., 140000"
                    value={newMaxCost}
                    onChange={(e) => setNewMaxCost(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="font-bold text-slate-700 block mb-1">Package Inclusions / Stay Details</label>
                  <input
                    type="text"
                    placeholder="e.g., Includes 3 days stay, surgeon fee, standard consumables, pre-op ECG"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300"
                  />
                </div>

                <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingProcedure(false)}
                    className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-700 text-white rounded-xl font-bold"
                  >
                    Save Procedure
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Procedure List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {estimates.map((est, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-slate-900 text-sm">{est.treatmentName}</h4>
                    <button
                      onClick={() => handleDeletePackage(est.treatmentName)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                      title="Delete Package"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-xl font-extrabold text-[#062B61]">
                      ₹{(est.minCost / 1000).toFixed(0)}k – ₹{(est.maxCost / 1000).toFixed(0)}k
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">(Estimated Cost)</span>
                  </div>

                  {est.notes && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <strong>Inclusions:</strong> {est.notes}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Room Type: General to Single Deluxe</span>
                  <span className="text-emerald-700 font-semibold">Live in Search Results</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: LIVE BED & INFRASTRUCTURE STATUS */}
      {activeTab === 'capacity' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs max-w-3xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Hospital Real-Time Operational Status</h2>
              <p className="text-xs text-slate-500">Live operational availability reflected to patient coordinators and navigators.</p>
            </div>
            {capacitySaved && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1 animate-fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Live status updated!
              </span>
            )}
          </div>

          <div className="space-y-5 text-xs sm:text-sm">
            {/* ICU Status */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
              <div>
                <span className="font-bold text-slate-900 block">Intensive Care Unit (ICU) Capacity</span>
                <span className="text-xs text-slate-500">Indicate whether emergency and post-op ICU beds are available.</span>
              </div>
              <div className="flex items-center gap-2">
                {(['Available', 'Limited', 'Full'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setCapacity({ ...capacity, icuStatus: st })}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      capacity.icuStatus === st
                        ? st === 'Available'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : st === 'Limited'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-rose-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Emergency Service */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
              <div>
                <span className="font-bold text-slate-900 block">24x7 Emergency &amp; Trauma Casualty</span>
                <span className="text-xs text-slate-500">Active emergency trauma desk and on-duty resuscitation team.</span>
              </div>
              <button
                onClick={() => setCapacity({ ...capacity, emergencyActive: !capacity.emergencyActive })}
                className={`px-4 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  capacity.emergencyActive ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                }`}
              >
                {capacity.emergencyActive ? 'Operational 24x7' : 'Casualty Diverting'}
              </button>
            </div>

            {/* Insurance Desk */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
              <div>
                <span className="font-bold text-slate-900 block">Cashless Insurance / TPA Helpdesk</span>
                <span className="text-xs text-slate-500">Pre-authorization desk open for immediate surgery queries.</span>
              </div>
              <button
                onClick={() => setCapacity({ ...capacity, tpaDeskOpen: !capacity.tpaDeskOpen })}
                className={`px-4 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  capacity.tpaDeskOpen ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                }`}
              >
                {capacity.tpaDeskOpen ? 'Desk Open (Active)' : 'Desk Closed for Day'}
              </button>
            </div>

            {/* Accepting Inquiries */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
              <div>
                <span className="font-bold text-slate-900 block">Accepting Patient Surgery Referrals</span>
                <span className="text-xs text-slate-500">Hospital is actively scheduling elective surgeries this week.</span>
              </div>
              <button
                onClick={() => setCapacity({ ...capacity, acceptingReferrals: !capacity.acceptingReferrals })}
                className={`px-4 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  capacity.acceptingReferrals ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                }`}
              >
                {capacity.acceptingReferrals ? 'Accepting Patients' : 'Temporarily Paused'}
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleSaveCapacity}
                className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm transition-colors shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Broadcast Live Status Update</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LEAD DETAIL & COORDINATOR NOTES */}
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
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-600" />
                  {selectedLead.mobile}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="text-slate-400 block mb-0.5">Surgical Requirement</span>
                <span className="font-bold text-emerald-900">{selectedLead.treatment}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="text-slate-400 block mb-0.5">Indicated Budget</span>
                <span className="font-bold text-slate-800">{selectedLead.budget}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="text-slate-400 block mb-0.5">Current Status</span>
                <span className="font-bold text-blue-800">{selectedLead.status}</span>
              </div>
            </div>

            {/* Existing Notes */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800 block">
                Hospital Activity &amp; Coordinator Log:
              </span>
              <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                {selectedLead.notes && selectedLead.notes.length > 0 ? (
                  selectedLead.notes.map((note, idx) => (
                    <div key={idx} className="p-2 rounded bg-white text-slate-700 shadow-2xs">
                      {note}
                    </div>
                  ))
                ) : (
                  <span className="text-slate-400 italic text-[11px]">No notes logged yet.</span>
                )}
              </div>
            </div>

            {/* Add Coordinator Note */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Record consultation time, doctor assigned, pre-auth..."
                  value={newCoordinatorNote}
                  onChange={(e) => setNewCoordinatorNote(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={handleAddHospitalNote}
                  className="px-3 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 cursor-pointer"
                >
                  Log Note
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <a
                href={`tel:${selectedLead.mobile}`}
                className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Patient Directly</span>
              </a>

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
    </div>
  );
};
