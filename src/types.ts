export type HospitalCategory = 'Premium Hospital' | 'Standard Hospital' | 'Budget-Friendly Hospital' | 'Specialty Hospital';

export type LeadStatus = 'New' | 'Contacted' | 'Assistance in Progress' | 'Hospital Selected' | 'Closed';

export type UserRole = 'admin' | 'hospital';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  hospitalId?: string;
  hospitalName?: string;
  title?: string;
  avatar?: string;
}

export interface HospitalCapacityStatus {
  icuStatus: 'Available' | 'Limited' | 'Full';
  generalBedsAvailable: number;
  emergencyActive: boolean;
  acceptingReferrals: boolean;
  tpaDeskOpen: boolean;
}

export interface TreatmentEstimate {
  treatmentName: string;
  minCost: number;
  maxCost: number;
  notes?: string;
}

export interface Hospital {
  id: string;
  name: string;
  category: HospitalCategory;
  location: string;
  city: string;
  rating: number;
  reviewCount: number;
  establishedYear: number;
  bedCount: number;
  specialties: string[];
  facilities: string[];
  accreditations: string[];
  description: string;
  imageUrl: string;
  phone: string;
  address: string;
  insuranceCashless: string[];
  treatmentEstimates: TreatmentEstimate[];
}

export interface CategoryInfo {
  id: string;
  name: HospitalCategory;
  shortDesc: string;
  fullDesc: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
}

export interface TreatmentInfo {
  id: string;
  name: string;
  category: string;
  averageBangaloreMinCost: number;
  averageBangaloreMaxCost: number;
  recoveryDays: string;
  typicalStay: string;
  description: string;
  commonProcedures: string[];
}

export interface Lead {
  id: string;
  name: string;
  mobile: string;
  treatment: string;
  budget: string;
  budgetNumeric?: number;
  city: string;
  createdAt: string;
  matchedHospitalIds: string[];
  matchedHospitalCount: number;
  status: LeadStatus;
  assignedRep?: string;
  notes?: string[];
  preferredHospitalId?: string;
  source?: string;
}

export interface SearchCriteria {
  name: string;
  mobile: string;
  treatment: string;
  budget: string;
  budgetNumeric?: number;
  city: string;
}
