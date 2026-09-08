import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { INITIAL_HOSPITALS, INITIAL_CATEGORIES, INITIAL_TREATMENTS, INITIAL_LEADS } from './src/data/initialData';
import { Hospital, CategoryInfo, TreatmentInfo, Lead, LeadStatus } from './src/types';

// In-memory persistent state (seeded with comprehensive initial data)
let hospitals: Hospital[] = [...INITIAL_HOSPITALS];
let categories: CategoryInfo[] = [...INITIAL_CATEGORIES];
let treatments: TreatmentInfo[] = [...INITIAL_TREATMENTS];
let leads: Lead[] = [...INITIAL_LEADS];

function parseBudgetNumeric(budgetString: string): number {
  if (!budgetString) return 1000000;
  const lower = budgetString.toLowerCase();
  if (lower.includes('below 50,000') || lower.includes('below ₹50,000')) return 50000;
  if (lower.includes('50,000 – 1 lakh') || lower.includes('50,000 – ₹1 lakh')) return 100000;
  if (lower.includes('1 – 2 lakh') || lower.includes('1 – ₹2 lakh')) return 200000;
  if (lower.includes('2 – 5 lakh') || lower.includes('2 – ₹5 lakh')) return 500000;
  if (lower.includes('5 lakh+') || lower.includes('5 lakh')) return 10000000;
  // If numeric string
  const digits = budgetString.replace(/[^0-9]/g, '');
  if (digits) {
    const val = parseInt(digits, 10);
    return val > 0 ? val : 1000000;
  }
  return 1000000;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // =================== API ROUTES ===================

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Hospitals: GET with dynamic matching & filters
  app.get('/api/hospitals', (req, res) => {
    const { treatment, budget, category, location, query } = req.query;
    let filtered = [...hospitals];

    if (treatment && typeof treatment === 'string' && treatment !== 'All Treatments' && treatment !== 'Other') {
      const targetTreatment = treatment.toLowerCase();
      filtered = filtered.filter(h =>
        h.treatmentEstimates.some(t => t.treatmentName.toLowerCase().includes(targetTreatment)) ||
        h.specialties.some(s => s.toLowerCase().includes(targetTreatment))
      );
    }

    if (budget && typeof budget === 'string') {
      const maxBudget = parseBudgetNumeric(budget);
      if (maxBudget < 10000000) {
        // filter or rank by affordability for the given treatment if specified
        if (treatment && typeof treatment === 'string' && treatment !== 'All Treatments' && treatment !== 'Other') {
          const targetTreatment = treatment.toLowerCase();
          filtered = filtered.filter(h => {
            const estimate = h.treatmentEstimates.find(t => t.treatmentName.toLowerCase().includes(targetTreatment));
            if (!estimate) return true;
            // allow hospitals whose minCost is within or close to budget
            return estimate.minCost <= maxBudget * 1.25;
          });
        }
      }
    }

    if (category && typeof category === 'string' && category !== 'All') {
      filtered = filtered.filter(h => h.category === category);
    }

    if (location && typeof location === 'string' && location !== 'All Locations' && location !== 'All') {
      filtered = filtered.filter(h => h.location.toLowerCase().includes(location.toLowerCase()));
    }

    if (query && typeof query === 'string' && query.trim()) {
      const q = query.toLowerCase().trim();
      filtered = filtered.filter(h =>
        h.name.toLowerCase().includes(q) ||
        h.location.toLowerCase().includes(q) ||
        h.specialties.some(s => s.toLowerCase().includes(q))
      );
    }

    res.json({
      success: true,
      count: filtered.length,
      data: filtered,
    });
  });

  // Single Hospital: GET
  app.get('/api/hospitals/:id', (req, res) => {
    const hospital = hospitals.find(h => h.id === req.params.id);
    if (!hospital) {
      return res.status(404).json({ success: false, error: 'Hospital not found' });
    }
    res.json({ success: true, data: hospital });
  });

  // Hospitals: POST (Admin add)
  app.post('/api/hospitals', (req, res) => {
    const body = req.body;
    if (!body.name || !body.category) {
      return res.status(400).json({ success: false, error: 'Name and category are required' });
    }
    const newHospital: Hospital = {
      id: `hosp-${Date.now()}`,
      name: body.name,
      category: body.category,
      location: body.location || 'Bangalore',
      city: 'Bangalore',
      rating: body.rating || 4.5,
      reviewCount: body.reviewCount || 50,
      establishedYear: body.establishedYear || 2015,
      bedCount: body.bedCount || 150,
      specialties: body.specialties || ['General Surgery'],
      facilities: body.facilities || ['NABH Accredited', '24x7 Emergency', 'Cashless TPA Desk'],
      accreditations: body.accreditations || ['NABH'],
      description: body.description || '',
      imageUrl: body.imageUrl || 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=800&q=80',
      phone: body.phone || '+91 80 4000 0000',
      address: body.address || 'Bangalore, Karnataka',
      insuranceCashless: body.insuranceCashless || ['Star Health', 'Medi Assist'],
      treatmentEstimates: body.treatmentEstimates || [],
    };
    hospitals.unshift(newHospital);
    res.status(201).json({ success: true, data: newHospital });
  });

  // Hospitals: PUT (Admin edit)
  app.put('/api/hospitals/:id', (req, res) => {
    const index = hospitals.findIndex(h => h.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Hospital not found' });
    }
    hospitals[index] = { ...hospitals[index], ...req.body, id: req.params.id };
    res.json({ success: true, data: hospitals[index] });
  });

  // Hospitals: DELETE (Admin delete)
  app.delete('/api/hospitals/:id', (req, res) => {
    const index = hospitals.findIndex(h => h.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Hospital not found' });
    }
    const deleted = hospitals.splice(index, 1);
    res.json({ success: true, data: deleted[0] });
  });

  // Categories: GET
  app.get('/api/categories', (req, res) => {
    res.json({ success: true, data: categories });
  });

  // Categories: PUT (Admin update category descriptions)
  app.put('/api/categories/:id', (req, res) => {
    const index = categories.findIndex(c => c.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }
    categories[index] = { ...categories[index], ...req.body, id: req.params.id };
    res.json({ success: true, data: categories[index] });
  });

  // Treatments: GET
  app.get('/api/treatments', (req, res) => {
    res.json({ success: true, data: treatments });
  });

  // Treatments: POST (Admin add treatment)
  app.post('/api/treatments', (req, res) => {
    const body = req.body;
    if (!body.name) {
      return res.status(400).json({ success: false, error: 'Treatment name required' });
    }
    const newTreatment: TreatmentInfo = {
      id: `treat-${Date.now()}`,
      name: body.name,
      category: body.category || 'General Surgery',
      averageBangaloreMinCost: body.averageBangaloreMinCost || 50000,
      averageBangaloreMaxCost: body.averageBangaloreMaxCost || 120000,
      recoveryDays: body.recoveryDays || '1–2 weeks',
      typicalStay: body.typicalStay || '1–2 days',
      description: body.description || '',
      commonProcedures: body.commonProcedures || [body.name],
    };
    treatments.push(newTreatment);
    res.status(201).json({ success: true, data: newTreatment });
  });

  // Leads: GET (Admin view leads)
  app.get('/api/leads', (req, res) => {
    const sorted = [...leads].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ success: true, count: sorted.length, data: sorted });
  });

  // Leads: POST (Create lead from patient search or callback request)
  app.post('/api/leads', (req, res) => {
    const { name, mobile, treatment, budget, city = 'Bangalore', preferredHospitalId, source = 'Search Tool' } = req.body;

    if (!name || !mobile || !treatment) {
      return res.status(400).json({ success: false, error: 'Name, mobile number, and treatment are required' });
    }

    const maxBudget = parseBudgetNumeric(budget);

    // Calculate matching hospitals dynamically
    let matching = hospitals.filter(h => {
      const hasTreatment = h.treatmentEstimates.some(t => t.treatmentName.toLowerCase().includes(treatment.toLowerCase())) ||
                           h.specialties.some(s => s.toLowerCase().includes(treatment.toLowerCase()));
      if (!hasTreatment) return false;
      const estimate = h.treatmentEstimates.find(t => t.treatmentName.toLowerCase().includes(treatment.toLowerCase()));
      if (estimate && maxBudget < 10000000) {
        return estimate.minCost <= maxBudget * 1.35;
      }
      return true;
    });

    if (matching.length === 0) {
      matching = hospitals.slice(0, 4);
    }

    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      name,
      mobile,
      treatment,
      budget: budget || '₹1 – ₹2 Lakh',
      budgetNumeric: maxBudget,
      city,
      createdAt: new Date().toISOString(),
      matchedHospitalIds: matching.map(h => h.id),
      matchedHospitalCount: matching.length,
      status: 'New' as LeadStatus,
      assignedRep: 'Unassigned',
      notes: [`Inquiry submitted for ${treatment}. Budget: ${budget}. Found ${matching.length} matching hospitals.`],
      preferredHospitalId,
      source,
    };

    leads.unshift(newLead);
    res.status(201).json({ success: true, data: newLead, matchingCount: matching.length });
  });

  // Leads: PATCH (Update lead status, assignment, notes)
  app.patch('/api/leads/:id', (req, res) => {
    const lead = leads.find(l => l.id === req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }
    const { status, assignedRep, note } = req.body;
    if (status) lead.status = status;
    if (assignedRep !== undefined) lead.assignedRep = assignedRep;
    if (note) {
      if (!lead.notes) lead.notes = [];
      lead.notes.push(`[${new Date().toLocaleTimeString('en-IN')}] ${note}`);
    }
    res.json({ success: true, data: lead });
  });

  // Stats: GET
  app.get('/api/stats', (req, res) => {
    res.json({
      success: true,
      totalHospitals: hospitals.length,
      totalTreatments: treatments.length,
      totalLeads: leads.length,
      newLeads: leads.filter(l => l.status === 'New').length,
      inProgressLeads: leads.filter(l => l.status === 'Contacted' || l.status === 'Assistance in Progress').length,
      closedLeads: leads.filter(l => l.status === 'Hospital Selected' || l.status === 'Closed').length,
    });
  });

  // =================== VITE MIDDLEWARE ===================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Right Hospital server listening on port ${PORT}`);
  });
}

startServer();
