import { Hospital, CategoryInfo, TreatmentInfo, Lead, SearchCriteria } from '../types';
import { INITIAL_HOSPITALS, INITIAL_CATEGORIES, INITIAL_TREATMENTS, INITIAL_LEADS } from '../data/initialData';

// Fallback in-memory client state if offline / fetch fails
let localHospitals = [...INITIAL_HOSPITALS];
let localCategories = [...INITIAL_CATEGORIES];
let localTreatments = [...INITIAL_TREATMENTS];
let localLeads = [...INITIAL_LEADS];

export const api = {
  async getHospitals(params?: {
    treatment?: string;
    budget?: string;
    category?: string;
    location?: string;
    query?: string;
  }): Promise<Hospital[]> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.treatment) searchParams.append('treatment', params.treatment);
      if (params?.budget) searchParams.append('budget', params.budget);
      if (params?.category) searchParams.append('category', params.category);
      if (params?.location) searchParams.append('location', params.location);
      if (params?.query) searchParams.append('query', params.query);

      const res = await fetch(`/api/hospitals?${searchParams.toString()}`);
      if (!res.ok) throw new Error('API fetch failed');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        localHospitals = json.data;
        return json.data;
      }
    } catch {
      console.warn('Falling back to client-side hospital filtering');
    }

    // Client-side fallback filter
    let results = [...localHospitals];
    if (params?.treatment && params.treatment !== 'All Treatments') {
      const tLower = params.treatment.toLowerCase();
      results = results.filter(h =>
        h.treatmentEstimates.some(t => t.treatmentName.toLowerCase().includes(tLower)) ||
        h.specialties.some(s => s.toLowerCase().includes(tLower))
      );
    }
    if (params?.category && params.category !== 'All') {
      results = results.filter(h => h.category === params.category);
    }
    if (params?.location && params.location !== 'All Locations' && params.location !== 'All') {
      results = results.filter(h => h.location.toLowerCase().includes(params.location!.toLowerCase()));
    }
    if (params?.query) {
      const q = params.query.toLowerCase().trim();
      results = results.filter(h =>
        h.name.toLowerCase().includes(q) ||
        h.location.toLowerCase().includes(q) ||
        h.specialties.some(s => s.toLowerCase().includes(q))
      );
    }
    return results;
  },

  async getHospitalById(id: string): Promise<Hospital | null> {
    try {
      const res = await fetch(`/api/hospitals/${id}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) return json.data;
      }
    } catch {
      // ignore
    }
    return localHospitals.find(h => h.id === id) || null;
  },

  async addHospital(hospital: Partial<Hospital>): Promise<Hospital> {
    try {
      const res = await fetch('/api/hospitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hospital),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // fallback
    }
    const newHosp = { ...hospital, id: `hosp-${Date.now()}` } as Hospital;
    localHospitals.unshift(newHosp);
    return newHosp;
  },

  async updateHospital(id: string, updates: Partial<Hospital>): Promise<Hospital> {
    try {
      const res = await fetch(`/api/hospitals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // fallback
    }
    const idx = localHospitals.findIndex(h => h.id === id);
    if (idx !== -1) {
      localHospitals[idx] = { ...localHospitals[idx], ...updates };
      return localHospitals[idx];
    }
    throw new Error('Hospital not found');
  },

  async deleteHospital(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/hospitals/${id}`, { method: 'DELETE' });
      if (res.ok) return true;
    } catch {
      // fallback
    }
    localHospitals = localHospitals.filter(h => h.id !== id);
    return true;
  },

  async getCategories(): Promise<CategoryInfo[]> {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          localCategories = json.data;
          return json.data;
        }
      }
    } catch {
      // ignore
    }
    return localCategories;
  },

  async updateCategory(id: string, updates: Partial<CategoryInfo>): Promise<CategoryInfo> {
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // ignore
    }
    const idx = localCategories.findIndex(c => c.id === id);
    if (idx !== -1) {
      localCategories[idx] = { ...localCategories[idx], ...updates };
      return localCategories[idx];
    }
    throw new Error('Category not found');
  },

  async getTreatments(): Promise<TreatmentInfo[]> {
    try {
      const res = await fetch('/api/treatments');
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          localTreatments = json.data;
          return json.data;
        }
      }
    } catch {
      // ignore
    }
    return localTreatments;
  },

  async getLeads(): Promise<Lead[]> {
    try {
      const res = await fetch('/api/leads');
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          localLeads = json.data;
          return json.data;
        }
      }
    } catch {
      // ignore
    }
    return localLeads;
  },

  async searchHospitals(criteria: { treatment?: string; budget?: string; location?: string }): Promise<Hospital[]> {
    return this.getHospitals({
      treatment: criteria.treatment,
      budget: criteria.budget,
      location: criteria.location,
    });
  },

  async createLead(criteria: SearchCriteria & { preferredHospitalId?: string; source?: string; matchedHospitalIds?: string[] }): Promise<{ lead: Lead; matchingCount: number }> {
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(criteria),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          return { lead: json.data, matchingCount: json.matchingCount };
        }
      }
    } catch {
      // ignore
    }

    // fallback lead creation
    const matchingCount = criteria.matchedHospitalIds ? criteria.matchedHospitalIds.length : 4;
    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      name: criteria.name,
      mobile: criteria.mobile,
      treatment: criteria.treatment,
      budget: criteria.budget,
      city: criteria.city || 'Bangalore',
      createdAt: new Date().toISOString(),
      matchedHospitalIds: criteria.matchedHospitalIds || localHospitals.slice(0, 4).map(h => h.id),
      matchedHospitalCount: matchingCount,
      status: 'New',
      assignedRep: 'Unassigned',
      notes: [`Inquiry submitted for ${criteria.treatment}`],
      preferredHospitalId: criteria.preferredHospitalId,
      source: criteria.source || 'Search Tool',
    };
    localLeads.unshift(newLead);
    return { lead: newLead, matchingCount };
  },

  async updateLead(id: string, updates: { status?: string; assignedRep?: string; note?: string }): Promise<Lead> {
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // ignore
    }

    const lead = localLeads.find(l => l.id === id);
    if (lead) {
      if (updates.status) lead.status = updates.status as any;
      if (updates.assignedRep !== undefined) lead.assignedRep = updates.assignedRep;
      if (updates.note) {
        if (!lead.notes) lead.notes = [];
        lead.notes.push(`[${new Date().toLocaleTimeString('en-IN')}] ${updates.note}`);
      }
      return lead;
    }
    throw new Error('Lead not found');
  },
};
