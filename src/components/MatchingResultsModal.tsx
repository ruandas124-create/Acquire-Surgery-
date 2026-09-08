import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ArrowRight, 
  Phone, 
  X, 
  CheckCircle2, 
  Sparkles, 
  HeartHandshake,
  ShieldCheck,
  MapPin,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Hospital } from '../types';

interface MatchingResultsModalProps {
  isOpen: boolean;
  name: string;
  mobile: string;
  treatment: string;
  location?: string;
  matchingHospitals: Hospital[];
  onClose: () => void;
  onViewHospitalOptions: () => void;
}

export const MatchingResultsModal: React.FC<MatchingResultsModalProps> = ({
  isOpen,
  name,
  mobile,
  treatment,
  location = 'Bangalore',
  matchingHospitals,
  onClose,
  onViewHospitalOptions,
}) => {
  // Categorize matching hospitals
  const totalCount = matchingHospitals.length;

  // Counts based on actual matching hospitals
  const premiumHospitals = matchingHospitals.filter(h => h.category === 'Premium Hospital');
  const standardHospitals = matchingHospitals.filter(h => h.category === 'Standard Hospital' || h.category === 'Specialty Hospital');
  const budgetHospitals = matchingHospitals.filter(h => h.category === 'Budget-Friendly Hospital');

  const premiumCount = premiumHospitals.length;
  const standardCount = standardHospitals.length;
  const budgetCount = budgetHospitals.length;

  // Animated counters
  const [displayTotal, setDisplayTotal] = useState(0);
  const [displayPremium, setDisplayPremium] = useState(0);
  const [displayStandard, setDisplayStandard] = useState(0);
  const [displayBudget, setDisplayBudget] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setDisplayTotal(0);
      setDisplayPremium(0);
      setDisplayStandard(0);
      setDisplayBudget(0);
      return;
    }

    // Check for prefers-reduced-motion
    const prefersReducedMotion = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? Boolean(window.matchMedia('(prefers-reduced-motion: reduce)')?.matches)
      : false;

    if (prefersReducedMotion) {
      setDisplayTotal(totalCount);
      setDisplayPremium(premiumCount);
      setDisplayStandard(standardCount);
      setDisplayBudget(budgetCount);
      return;
    }

    // Fast, professional number animation (~600ms)
    const duration = 600;
    const startTime = typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : Date.now();

    let animId: number;
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);

      setDisplayTotal(Math.round(totalCount * ease));
      setDisplayPremium(Math.round(premiumCount * ease));
      setDisplayStandard(Math.round(standardCount * ease));
      setDisplayBudget(Math.round(budgetCount * ease));

      if (progress < 1) {
        if (typeof requestAnimationFrame === 'function') {
          animId = requestAnimationFrame(animate);
        }
      } else {
        setDisplayTotal(totalCount);
        setDisplayPremium(premiumCount);
        setDisplayStandard(standardCount);
        setDisplayBudget(budgetCount);
      }
    };

    if (typeof requestAnimationFrame === 'function') {
      animId = requestAnimationFrame(animate);
      return () => {
        if (typeof cancelAnimationFrame === 'function' && animId) {
          cancelAnimationFrame(animId);
        }
      };
    } else {
      setDisplayTotal(totalCount);
      setDisplayPremium(premiumCount);
      setDisplayStandard(standardCount);
      setDisplayBudget(budgetCount);
    }
  }, [isOpen, totalCount, premiumCount, standardCount, budgetCount]);

  if (!isOpen) return null;

  return (
    <div
      id="matching-hospital-results-modal"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm transition-all"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.96 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        onClick={e => e.stopPropagation()}
        className="bg-white w-full max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/90 relative overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Top Accent Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#0A3B75] via-[#0284C7] to-[#059669]" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-3 sm:pb-4 relative border-b border-slate-100 text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[11px] font-bold text-[#0A3B75] mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Matching Hospitals Found</span>
          </div>

          {/* Heading */}
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Hospital Options
          </h2>

          {/* Short Requirement Summary (No budget displayed) */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-2.5 text-xs">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-100 text-slate-800 font-semibold border border-slate-200/80">
              <Activity className="w-3.5 h-3.5 text-[#0A3B75]" />
              <span>Treatment: <strong className="font-bold text-slate-900">{treatment}</strong></span>
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-100 text-slate-800 font-semibold border border-slate-200/80">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>Location: <strong className="font-bold text-slate-900">{location}</strong></span>
            </span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 pt-4 space-y-5 overflow-y-auto">
          {/* Summary Box displaying Categories and Counts */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-blue-50/70 via-sky-50/30 to-white border border-blue-200/90 shadow-xs">
            <div className="flex items-center justify-between border-b border-blue-200/60 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#0A3B75]" />
                <span className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  Matching Hospital Breakdown
                </span>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#0A3B75] text-white font-extrabold text-xs sm:text-sm">
                Total: {displayTotal} Hospitals
              </span>
            </div>

            {/* List of matching hospital categories and counts */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-[#0A3B75]"></span>
                  <div>
                    <div className="text-sm font-bold text-slate-900">Premium Hospitals</div>
                    <div className="text-[11px] text-slate-500">Hospitals with broader facilities and service options</div>
                  </div>
                </div>
                <div className="text-xl font-extrabold text-[#0A3B75] px-2.5 py-0.5 rounded-lg bg-blue-50">
                  {displayPremium}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-[#0284C7]"></span>
                  <div>
                    <div className="text-sm font-bold text-slate-900">Standard Hospitals</div>
                    <div className="text-[11px] text-slate-500">Hospitals offering commonly required treatment facilities</div>
                  </div>
                </div>
                <div className="text-xl font-extrabold text-[#0284C7] px-2.5 py-0.5 rounded-lg bg-sky-50">
                  {displayStandard}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-[#059669]"></span>
                  <div>
                    <div className="text-sm font-bold text-slate-900">Budget-Friendly Hospitals</div>
                    <div className="text-[11px] text-slate-500">Hospitals offering more economical options</div>
                  </div>
                </div>
                <div className="text-xl font-extrabold text-[#059669] px-2.5 py-0.5 rounded-lg bg-emerald-50">
                  {displayBudget}
                </div>
              </div>
            </div>

            {/* Total Row */}
            <div className="mt-4 pt-3 border-t border-blue-200/80 flex items-center justify-between text-sm">
              <span className="font-extrabold text-slate-800 uppercase tracking-wide">Total Hospitals Available</span>
              <span className="font-black text-lg text-[#0A3B75]">{displayTotal} Hospitals</span>
            </div>
          </div>

          {/* Representative Message (Exact text required by user) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 text-left space-y-2.5">
            <div className="flex items-start gap-3">
              <HeartHandshake className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm sm:text-base text-slate-800 font-semibold leading-relaxed">
                  A Right Hospital representative will connect with you shortly to help you choose the best hospital based on your treatment need and budget.
                </p>
              </div>
            </div>

            <div className="pt-2.5 border-t border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Request logged for {name || 'Patient'}</span>
              </div>
              <div>
                Connecting on: <strong className="text-slate-800">{mobile || 'your mobile number'}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer CTAs: 1. Close, 2. View Hospitals */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
          {/* Button 1: Close */}
          <button
            id="modal-close-results-btn"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-sm rounded-xl border border-slate-300 transition-colors cursor-pointer"
          >
            Close
          </button>

          {/* Button 2: View Hospitals */}
          <button
            id="modal-view-hospitals-btn"
            onClick={onViewHospitalOptions}
            className="w-full sm:w-auto bg-[#0A3B75] hover:bg-[#08305f] text-white font-bold text-sm sm:text-base py-3 px-7 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>View Hospitals</span>
            <ArrowRight className="w-4 h-4 text-blue-200" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
