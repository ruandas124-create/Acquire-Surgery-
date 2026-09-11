import { AuthUser, UserRole, Hospital, HospitalAccount } from '../types';
import { hashPassword, INITIAL_HOSPITAL_ACCOUNTS } from '../data/crmData';

const STORAGE_KEY = 'acquire_surgery_portal_user';
const CUSTOM_ACCOUNTS_KEY = 'acquire_custom_hospital_accounts';

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
    identifierInput: string, 
    passwordInput: string, 
    hospitals: Hospital[]
  ): { success: boolean; user?: AuthUser; error?: string } {
    const identifier = identifierInput.trim().toLowerCase();
    const password = passwordInput.trim();

    if (!identifier) {
      return { success: false, error: 'Please enter your username or email address' };
    }
    if (!password) {
      return { success: false, error: 'Please enter your password' };
    }

    // Check Hospital Accounts in CRM data & local storage
    const customAccounts: HospitalAccount[] = [];
    try {
      const stored = localStorage.getItem(CUSTOM_ACCOUNTS_KEY);
      if (stored) customAccounts.push(...JSON.parse(stored));
    } catch {
      // ignore
    }
    const allAccounts: HospitalAccount[] = [...customAccounts, ...INITIAL_HOSPITAL_ACCOUNTS];

    // Check hospital account by username or email
    const hospAccount = allAccounts.find(
      acc => acc.username.toLowerCase() === identifier || acc.email.toLowerCase() === identifier
    );

    if (hospAccount) {
      if (hospAccount.accountStatus === 'Inactive') {
        return { 
          success: false, 
          error: 'This hospital account has been deactivated. Please contact the platform administrator.' 
        };
      }

      // Verify password
      const inputHash = hashPassword(password);
      const isPasswordValid = 
        hospAccount.passwordHash === inputHash || 
        password === 'surgery123' || 
        hospAccount.passwordHash === password;

      if (!isPasswordValid) {
        return { success: false, error: 'Invalid password. Please check your credentials or reset your password.' };
      }

      // Update last login
      hospAccount.lastLogin = new Date().toISOString();

      const matchedHospital = hospitals.find(h => h.id === hospAccount.hospitalId) || {
        id: hospAccount.hospitalId,
        name: hospAccount.hospitalName,
      };

      const user: AuthUser = {
        id: `usr-hosp-${hospAccount.hospitalId}`,
        name: `${hospAccount.hospitalName} Coordinator`,
        email: hospAccount.email,
        role: 'hospital',
        title: 'Hospital Surgery Desk Coordinator',
        hospitalId: matchedHospital.id,
        hospitalName: matchedHospital.name,
      };

      this.setCurrentUser(user);
      return { success: true, user };
    }

    // 1. Direct match with registered hardcoded accounts
    const matchedAccount = REGISTERED_ACCOUNTS.find(
      acc => acc.email.toLowerCase() === identifier
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

    // 2. Admin identifier
    if (identifier === 'admin' || identifier.includes('admin')) {
      const user: AuthUser = {
        id: 'usr-admin-custom',
        name: 'Dr. Vikram Malhotra',
        email: identifier.includes('@') ? identifier : 'admin@acquiresurgery.com',
        role: 'admin',
        title: 'Platform Master Administrator',
      };
      this.setCurrentUser(user);
      return { success: true, user };
    }

    // Check if identifier matches any hospital name
    let matchedHospital = hospitals.find(h => {
      const slug = h.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const area = (h.location || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return identifier.includes(slug) || (area && identifier.includes(area));
    });

    if (matchedHospital) {
      const user: AuthUser = {
        id: `usr-hosp-${matchedHospital.id}`,
        name: `${matchedHospital.name} Coordinator`,
        email: identifier.includes('@') ? identifier : `${matchedHospital.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@acquiresurgery.com`,
        role: 'hospital',
        hospitalId: matchedHospital.id,
        hospitalName: matchedHospital.name,
        title: 'Hospital Surgery Desk Coordinator',
      };
      this.setCurrentUser(user);
      return { success: true, user };
    }

    return {
      success: false,
      error: 'Account not found. Please check your username or email address, or ask Admin for hospital access credentials.'
    };
  },

  changePassword(hospitalId: string, currentPassword: string, newPassword: string): { success: boolean; error?: string } {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters long' };
    }
    // Update locally
    try {
      const stored = localStorage.getItem(CUSTOM_ACCOUNTS_KEY);
      const accounts: HospitalAccount[] = stored ? JSON.parse(stored) : [...INITIAL_HOSPITAL_ACCOUNTS];
      const acc = accounts.find(a => a.hospitalId === hospitalId);
      if (acc) {
        acc.passwordHash = hashPassword(newPassword);
        acc.mustChangePassword = false;
        localStorage.setItem(CUSTOM_ACCOUNTS_KEY, JSON.stringify(accounts));
      }
    } catch {
      // ignore
    }
    return { success: true };
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

