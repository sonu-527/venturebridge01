import React, { useState, useEffect } from 'react';
import { X, Rocket, CheckCircle2, AlertCircle, BarChart3 } from 'lucide-react';
import { api } from '../services/api';
import { Startup, MonthlySalesData, UnitEconomicsData } from '../types';

interface EditStartupModalProps {
  startup: Startup | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const YEARS = ['2024', '2025', '2026', '2027'];

export const EditStartupModal: React.FC<EditStartupModalProps> = ({
  startup,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'financials'>('details');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    problem: '',
    solution: '',
    category: 'Tech Startups' as 'Tech Startups' | 'Non-Tech Startups' | 'Social Welfare Startups',
    industry: '',
    stage: 'MVP / Prototype',
    location: '',
    website: '',
    required_skills: '',
    team_size: 1,
    funding_stage: 'Pre-Seed',
    funding_requirement: '',
  });

  // Financials State
  const [monthlySales, setMonthlySales] = useState<MonthlySalesData[]>([]);
  const [financialsVisibility, setFinancialsVisibility] = useState<'PUBLIC' | 'INVESTOR_ONLY'>('PUBLIC');
  const [fundingCurrency, setFundingCurrency] = useState<'INR' | 'USD'>('INR');

  // Month entry controls
  const [newMonth, setNewMonth] = useState('May');
  const [newYear, setNewYear] = useState('2026');
  const [newRevenue, setNewRevenue] = useState<string>('');
  const [newOrders, setNewOrders] = useState<string>('');
  const [entryError, setEntryError] = useState<string | null>(null);

  // Unit economics state
  const [cac, setCac] = useState<string>('');
  const [cogs, setCogs] = useState<string>('');
  const [logistics, setLogistics] = useState<string>('');
  const [revenuePerUnit, setRevenuePerUnit] = useState<string>('');
  const [netMargin, setNetMargin] = useState<string>('');
  const [econNotes, setEconNotes] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (startup) {
      setFormData({
        name: startup.name || '',
        description: startup.description || '',
        problem: startup.problem || '',
        solution: startup.solution || '',
        category: (startup.category as any) || 'Tech Startups',
        industry: startup.industry || '',
        stage: startup.stage || 'MVP / Prototype',
        location: startup.location || '',
        website: startup.website || '',
        required_skills: Array.isArray(startup.required_skills)
          ? startup.required_skills.join(', ')
          : '',
        team_size: startup.team_size || 1,
        funding_stage: startup.funding_stage || 'Pre-Seed',
        funding_requirement: startup.funding_requirement || '',
      });

      const initialSales = startup.monthly_sales
        ? (Array.isArray(startup.monthly_sales) ? startup.monthly_sales : [startup.monthly_sales])
        : [];
      setMonthlySales(initialSales);

      const econ = startup.unit_economics;
      setCac(econ?.cac ? String(econ.cac) : '');
      setCogs(econ?.cogs ? String(econ.cogs) : '');
      setLogistics(econ?.logistics ? String(econ.logistics) : '');
      setRevenuePerUnit(econ?.revenue_per_unit ? String(econ.revenue_per_unit) : '');
      setNetMargin(econ?.net_margin ? String(econ.net_margin) : '');
      setEconNotes(econ?.notes || '');

      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [startup, isOpen]);

  if (!isOpen || !startup) return null;

  const handleAddOrUpdateMonth = () => {
    setEntryError(null);
    const rev = parseFloat(newRevenue);
    if (isNaN(rev) || rev < 0) {
      setEntryError('Please enter a valid positive sales figure.');
      return;
    }

    const formattedMonth = `${newMonth} ${newYear}`;
    const ordersNum = newOrders ? parseInt(newOrders, 10) : undefined;

    setMonthlySales((prev) => {
      const idx = prev.findIndex((s) => s.month.toLowerCase() === formattedMonth.toLowerCase());
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { month: formattedMonth, revenue: rev, orders: ordersNum, currency: fundingCurrency };
        return copy;
      }
      return [...prev, { month: formattedMonth, revenue: rev, orders: ordersNum, currency: fundingCurrency }];
    });

    setNewRevenue('');
    setNewOrders('');
  };

  const handleRemoveMonth = (idx: number) => {
    setMonthlySales((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const skillsArray = formData.required_skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      // 1. Update basic profile
      await api.updateStartup(startup.id, {
        ...formData,
        required_skills: skillsArray,
      });

      // 2. Update financials
      let unitEconomics: UnitEconomicsData | null = null;
      if (cac || cogs || logistics || revenuePerUnit || netMargin || econNotes) {
        unitEconomics = {
          cac: cac ? parseFloat(cac) : undefined,
          cogs: cogs ? parseFloat(cogs) : undefined,
          logistics: logistics ? parseFloat(logistics) : undefined,
          revenue_per_unit: revenuePerUnit ? parseFloat(revenuePerUnit) : undefined,
          net_margin: netMargin ? parseFloat(netMargin) : undefined,
          currency: fundingCurrency,
          notes: econNotes.trim() || undefined,
        };
      }

      await api.updateStartupFinancials(startup.id, {
        monthly_sales: monthlySales,
        unit_economics: unitEconomics,
        financials_visibility: financialsVisibility,
        funding_currency: fundingCurrency,
      });

      setSuccessMessage('Startup profile and business financials updated successfully.');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update startup.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Edit Startup Profile & Financials</h3>
              <p className="text-xs text-slate-500">Update venture details, team needs, and monthly sales trajectory</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-white px-6">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'details'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Rocket className="w-3.5 h-3.5" />
            Startup Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('financials')}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'financials'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Monthly Sales & Unit Economics
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {successMessage && (
            <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{errorMessage}</span>
            </div>
          )}

          {activeTab === 'details' ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Startup Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-600"
                  >
                    <option value="Tech Startups">Tech Startups</option>
                    <option value="Non-Tech Startups">Non-Tech Startups</option>
                    <option value="Social Welfare Startups">Social Welfare Startups</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Industry
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Current Stage
                  </label>
                  <select
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-600"
                  >
                    <option value="Idea Phase">Idea Phase</option>
                    <option value="MVP / Prototype">MVP / Prototype</option>
                    <option value="Early Traction">Early Traction</option>
                    <option value="Scaling">Scaling</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Short Description / Mission
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Problem Addressed
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formData.problem}
                    onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Proposed Solution
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formData.solution}
                    onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Funding Target
                  </label>
                  <input
                    type="text"
                    value={formData.funding_requirement}
                    onChange={(e) => setFormData({ ...formData, funding_requirement: e.target.value })}
                    placeholder="e.g. $150,000"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Funding Stage
                  </label>
                  <select
                    value={formData.funding_stage}
                    onChange={(e) => setFormData({ ...formData, funding_stage: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-600"
                  >
                    <option value="Bootstrapped">Bootstrapped</option>
                    <option value="Pre-Seed">Pre-Seed</option>
                    <option value="Seed">Seed</option>
                    <option value="Series A">Series A</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Required Skills / Roles (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.required_skills}
                  onChange={(e) => setFormData({ ...formData, required_skills: e.target.value })}
                  placeholder="e.g. React, Python, Product Design"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                />
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {/* Financials Visibility & Currency */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Financials Visibility</label>
                  <select
                    value={financialsVisibility}
                    onChange={(e) => setFinancialsVisibility(e.target.value as any)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="PUBLIC">🌐 Public (All Users)</option>
                    <option value="INVESTOR_ONLY">🔒 Investor-Only (Verified Investors)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Currency</label>
                  <select
                    value={fundingCurrency}
                    onChange={(e) => setFundingCurrency(e.target.value as any)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>

              {/* Monthly Sales Records List */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Monthly Sales Records
                  </span>
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {monthlySales.length} saved records
                  </span>
                </div>

                {monthlySales.length === 0 ? (
                  <div className="p-4 bg-white rounded-lg border border-dashed border-slate-200 text-center text-xs text-slate-400">
                    Monthly sales data has not been added yet. Add records below.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {monthlySales.map((s, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-xs">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-800">{s.month}</span>
                          <span className="font-mono text-blue-700 font-semibold">
                            {s.currency === 'USD' ? '$' : '₹'}{(s.revenue || 0).toLocaleString()}
                          </span>
                          {s.orders !== undefined && s.orders > 0 && (
                            <span className="text-slate-400 font-mono text-[11px]">
                              ({s.orders} orders)
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveMonth(idx)}
                          className="text-slate-400 hover:text-red-600 px-2 py-0.5 rounded hover:bg-red-50 text-xs cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new record */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[11px] font-bold text-slate-700 uppercase block">
                    Add or Update Month Record
                  </span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase font-semibold">Month</label>
                      <select
                        value={newMonth}
                        onChange={(e) => setNewMonth(e.target.value)}
                        className="w-full text-xs p-1.5 rounded-lg border border-slate-200 bg-white"
                      >
                        {MONTHS.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase font-semibold">Year</label>
                      <select
                        value={newYear}
                        onChange={(e) => setNewYear(e.target.value)}
                        className="w-full text-xs p-1.5 rounded-lg border border-slate-200 bg-white"
                      >
                        {YEARS.map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase font-semibold">Sales Amount</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={newRevenue}
                        onChange={(e) => setNewRevenue(e.target.value)}
                        placeholder="e.g. 240000"
                        className="w-full text-xs p-1.5 rounded-lg border border-slate-200 bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase font-semibold">Orders (opt)</label>
                      <input
                        type="number"
                        min="0"
                        value={newOrders}
                        onChange={(e) => setNewOrders(e.target.value)}
                        placeholder="e.g. 120"
                        className="w-full text-xs p-1.5 rounded-lg border border-slate-200 bg-white font-mono"
                      />
                    </div>
                  </div>

                  {entryError && (
                    <p className="text-[11px] text-red-600 font-semibold">{entryError}</p>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleAddOrUpdateMonth}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                    >
                      + Save Month Record
                    </button>
                  </div>
                </div>
              </div>

              {/* Optional Unit Economics */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div>
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    Optional Unit Economics Structure
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Omit if not applicable. Per-unit metrics help investors evaluate margins.
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 uppercase">Rev Per Unit</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={revenuePerUnit}
                      onChange={(e) => setRevenuePerUnit(e.target.value)}
                      placeholder="e.g. 5000"
                      className="w-full text-xs p-1.5 rounded-lg border border-slate-200 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 uppercase">COGS (Direct)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={cogs}
                      onChange={(e) => setCogs(e.target.value)}
                      placeholder="e.g. 1500"
                      className="w-full text-xs p-1.5 rounded-lg border border-slate-200 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 uppercase">CAC</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={cac}
                      onChange={(e) => setCac(e.target.value)}
                      placeholder="e.g. 800"
                      className="w-full text-xs p-1.5 rounded-lg border border-slate-200 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 uppercase">Logistics</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={logistics}
                      onChange={(e) => setLogistics(e.target.value)}
                      placeholder="e.g. 300"
                      className="w-full text-xs p-1.5 rounded-lg border border-slate-200 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 uppercase">Net Margin</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={netMargin}
                      onChange={(e) => setNetMargin(e.target.value)}
                      placeholder="e.g. 2400"
                      className="w-full text-xs p-1.5 rounded-lg border border-slate-200 bg-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-600 uppercase">Model Assumptions / Notes</label>
                  <input
                    type="text"
                    value={econNotes}
                    onChange={(e) => setEconNotes(e.target.value)}
                    placeholder="e.g. Subscription retention average 18 months, logistics includes warehousing"
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 shadow-xs cursor-pointer"
            >
              {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
