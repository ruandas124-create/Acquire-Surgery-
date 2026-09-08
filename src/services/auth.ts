import { AuthUser, UserRole, Hospital } from '../types';

const STORAGE_KEY = 'acquire_surgery_portal_user';

export interface RegisteredAccount {
  email: string;
  role: UserRole;
  name: string;
  title: string;
  hospitalId?: string;
  hospitalName?: string;
  description: string;
}

export const REGISTERED_ACCOUNTS: RegisteredAccount[] = [
  {
    email: 'admin@acquiresurgery.com',
    role: 'admin',
    name: 'Dr. Vikram Malhotra',
    title: 'Platform Master Administrator',
    description: 'Full master access to all patient inquiries, hospital directory, and pricing benchmarks.',
  },
  {
    email: 'manipal@acquiresurgery.com',
    role: 'hospital',
    name: 'Suresh Nambiar',
    title: 'Senior Surgery Desk Coordinator',
    hospitalId: 'hosp-manipal-oar',
    hospitalName: 'Manipal Hospital, Old Airport Road',
    description: 'Manipal Hospital patient referrals, packages, and bed capacity.',
  },
  {
    email: 'aster@acquiresurgery.com',
    role: 'hospital',
    name: 'Dr. Anita Sen',
    title: 'Surgical Referral Head',
    hospitalId: 'hosp-aster-cmi',
    hospitalName: 'Aster CMI Hospital',
    description: 'Aster CMI patient consultations, pricing, and live ICU status.',
  },
  {
    email: 'narayana@acquiresurgery.com',
    role: 'hospital',
    name: 'Rohan Kulkarni',
    title: 'Patient Care Navigator',
    hospitalId: 'hosp-narayana-hsr',
    hospitalName: 'Narayana Multispeciality Hospital, HSR',
    description: 'Narayana HSR surgical admissions, surgery packages, and capacity.',
  },
  {
    email: 'apollo@acquiresurgery.com',
    role: 'hospital',
    name: 'Pooja Hegde',
    title: 'Hospital Coordinator',
    hospitalId: 'hosp-apollo-bannerghatta',
    hospitalName: 'Apollo Hospital, Bannerghatta Road',
    description: 'Apollo Bannerghatta patient referrals and packages.',
  },
  {
    email: 'fortis@acquiresurgery.com',
    role: 'hospital',
    name: 'Dr. Rajesh Rao',
    title: 'Partner Care Desk',
    hospitalId: 'hosp-fortis-bg-road',
    hospitalName: 'Fortis Hospital, Bannerghatta Road',
    description: 'Fortis Hospital surgery referrals and live bed status.',
  },
];

export const authService = {
  getCurrentUser(): AuthUser | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as AuthUser;
      }
    } catch {
      // ignore
    }
    return null;
  },

  setCurrentUser(user: AuthUser | null): void {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  },

  loginWithEmailAndPassword(
    emailInput: string, 
    passwordInput: string, 
    hospitals: Hospital[]
  ): { success: boolean; user?: AuthUser; error?: string } {
    const email = emailInput.trim().toLowerCase();
    const password = passwordInput.trim();

    if (!email) {
      return { success: false, error: 'Please enter your email address' };
    }
    if (!password) {
      return { success: false, error: 'Please enter your password' };
    }

    // 1. Direct match with registered accounts
    const matchedAccount = REGISTERED_ACCOUNTS.find(
      acc => acc.email.toLowerCase() === email
    );

    if (matchedAccount) {
      const user: AuthUser = {
        id: `usr-${matchedAccount.role}-${matchedAccount.hospitalId || 'admin'}`,
        name: matchedAccount.name,
        email: matchedAccount.email,
        role: matchedAccount.role,
        title: matchedAccount.title,
        hospitalId: matchedAccount.hospitalId,
        hospitalName: matchedAccount.hospitalName,
      };
      this.setCurrentUser(user);
      return { success: true, user };
    }

    // 2. Dynamic check by email domain/keyword
    // Check if admin email
    if (email.includes('admin')) {
      const user: AuthUser = {
        id: 'usr-admin-custom',
        name: email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Platform Administrator',
        email,
        role: 'admin',
        title: 'Platform Administrator',
      };
      this.setCurrentUser(user);
      return { success: true, user };
    }

    // Check if hospital email
    // Search if email matches any hospital name
    let matchedHospital = hospitals.find(h => {
      const slug = h.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const area = (h.location || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return email.includes(slug) || (area && email.includes(area));
    });

    // Check common hospital brand keywords in email
    if (!matchedHospital) {
      if (email.includes('manipal')) {
        matchedHospital = hospitals.find(h => h.id === 'hosp-manipal-oar') || hospitals[0];
      } else if (email.includes('aster')) {
        matchedHospital = hospitals.find(h => h.id === 'hosp-aster-cmi') || hospitals[0];
      } else if (email.includes('narayana')) {
        matchedHospital = hospitals.find(h => h.id === 'hosp-narayana-hsr') || hospitals[0];
      } else if (email.includes('apollo')) {
        matchedHospital = hospitals.find(h => h.id === 'hosp-apollo-bannerghatta') || hospitals[0];
      } else if (email.includes('fortis')) {
        matchedHospital = hospitals.find(h => h.id === 'hosp-fortis-bg-road') || hospitals[0];
      } else if (email.includes('sparsh')) {
        matchedHospital = hospitals.find(h => h.id === 'hosp-sparsh-yeshwanthpur') || hospitals[0];
      } else if (email.includes('sakra')) {
        matchedHospital = hospitals.find(h => h.id === 'hosp-sakra-world') || hospitals[0];
      } else if (email.includes('baptist')) {
        matchedHospital = hospitals.find(h => h.id === 'hosp-bangalore-baptist') || hospitals[0];
      } else if (email.includes('hospital') || email.includes('desk') || email.includes('coordinator')) {
        // Fallback to first hospital partner
        matchedHospital = hospitals[0];
      }
    }

    if (matchedHospital) {
      const user: AuthUser = {
        id: `usr-hosp-${matchedHospital.id}`,
        name: `${matchedHospital.name} Coordinator`,
        email,
        role: 'hospital',
        hospitalId: matchedHospital.id,
        hospitalName: matchedHospital.name,
        title: 'Hospital Surgery Desk Coordinator',
      };
      this.setCurrentUser(user);
      return { success: true, user };
    }

    // Default fallback: if neither specific keyword matched, treat as hospital partner coordinator for default hospital
    const defaultHosp = hospitals[0] || { id: 'hosp-manipal-oar', name: 'Manipal Hospital' };
    const user: AuthUser = {
      id: `usr-hosp-${defaultHosp.id}`,
      name: email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Hospital Coordinator',
      email,
      role: 'hospital',
      hospitalId: defaultHosp.id,
      hospitalName: defaultHosp.name,
      title: 'Hospital Surgery Desk',
    };
    this.setCurrentUser(user);
    return { success: true, user };
  },

  loginAsAdmin(email?: string): AuthUser {
    const user: AuthUser = {
      id: 'usr-admin-1',
      name: 'Dr. Vikram Malhotra',
      email: email || 'admin@acquiresurgery.com',
      role: 'admin',
      title: 'Platform Master Administrator',
    };
    this.setCurrentUser(user);
    return user;
  },

  loginAsHospital(hospital: Hospital, coordinatorName?: string, email?: string): AuthUser {
    const user: AuthUser = {
      id: `usr-hosp-${hospital.id}`,
      name: coordinatorName || `${hospital.name} Coordinator`,
      email: email || `desk@${hospital.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      role: 'hospital',
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      title: 'Hospital Patient Care Desk',
    };
    this.setCurrentUser(user);
    return user;
  },

  logout(): void {
    this.setCurrentUser(null);
  }
};
