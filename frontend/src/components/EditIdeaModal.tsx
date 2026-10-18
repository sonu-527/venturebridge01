import React, { useState } from 'react';
import { api } from '../services/api';
import { StartupIdea, MonthlySalesData, UnitEconomicsData } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface EditIdeaModalProps {
  idea: StartupIdea;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
  onIdeaUpdated?: () => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const YEARS = ['2024', '2025', '2026', '2027'];

export const EditIdeaModal: React.FC<EditIdeaModalProps> = ({
  idea,
  isOpen,
  onClose,
  onUpdated,
  onIdeaUpdated,
}) => {
  const { t } = useLanguage();
  const [title, setTitle] = useState(idea.title || '');
  const [problem, setProblem] = useState(idea.problem_statement || '');
  const [solution, setSolution] = useState(idea.proposed_solution || '');
  const [audience, setAudience] = useState(idea.target_audience || '');
  const [industry, setIndustry] = useState(idea.industry || 'Tech');
  const [skillsStr, setSkillsStr] = useState(idea.required_skills?.join(', ') || '');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'INVESTOR_ONLY'>(idea.visibility || 'PUBLIC');

  // Existing monthly sales (NO demo fallback)
  const initialSales: MonthlySalesData[] = idea.monthly_sales
    ? (Array.isArray(idea.monthly_sales) ? idea.monthly_sales : [idea.monthly_sales])
    : [];
  const [monthlySales, setMonthlySales] = useState<MonthlySalesData[]>(initialSales);

  // New month entry form state
  const [newMonth, setNewMonth] = useState('May');
  const [newYear, setNewYear] = useState('2026');
  const [newRevenue, setNewRevenue] = useState<string>('');
  const [newOrders, setNewOrders] = useState<string>('');
  const [newCurrency, setNewCurrency] = useState<'INR' | 'USD'>('INR');
  const [entryError, setEntryError] = useState<string | null>(null);

  // Optional Unit economics editing
  const existingEcon = idea.unit_economics;
  const [cac, setCac] = useState<string>(existingEcon?.cac ? String(existingEcon.cac) : '');
  const [cogs, setCogs] = useState<string>(existingEcon?.cogs ? String(existingEcon.cogs) : '');
  const [logistics, setLogistics] = useState<string>(existingEcon?.logistics ? String(existingEcon.logistics) : '');
  const [revenuePerUnit, setRevenuePerUnit] = useState<string>(existingEcon?.revenue_per_unit ? String(existingEcon.revenue_per_unit) : '');
  const [netMargin, setNetMargin] = useState<string>(existingEcon?.net_margin ? String(existingEcon.net_margin) : '');
  const [econNotes, setEconNotes] = useState<string>(existingEcon?.notes || '');

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddOrUpdateRecord = () => {
    setEntryError(null);
    const revNum = parseFloat(newRevenue);
    if (isNaN(revNum) || revNum < 0) {
      setEntryError('Please enter a valid non-negative sales amount.');
      return;
    }

    const formattedMonth = `${newMonth} ${newYear}`;
    const ordersNum = newOrders ? parseInt(newOrders, 10) : undefined;

    setMonthlySales((prev) => {
      // Deduplicate: replace existing record for same month/year or append
      const existingIdx = prev.findIndex((s) => s.month.toLowerCase() === formattedMonth.toLowerCase());
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = {
          month: formattedMonth,
          revenue: revNum,
          orders: ordersNum,
          currency: newCurrency,
        };
        return copy;
      }
      return [
        ...prev,
        {
          month: formattedMonth,
          revenue: revNum,
          orders: ordersNum,
          currency: newCurrency,
        },
      ];
    });

    setNewRevenue('');
    setNewOrders('');
  };

  const handleRemoveMonth = (idx: number) => {
    setMonthlySales((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage(null);
      const skills = skillsStr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      // Build unit economics only if user entered at least one field
      let unitEconomics: UnitEconomicsData | null = null;
      if (cac || cogs || logistics || revenuePerUnit || netMargin || econNotes) {
        unitEconomics = {
          cac: cac ? parseFloat(cac) : undefined,
          cogs: cogs ? parseFloat(cogs) : undefined,
          logistics: logistics ? parseFloat(logistics) : undefined,
          revenue_per_unit: revenuePerUnit ? parseFloat(revenuePerUnit) : undefined,
          net_margin: netMargin ? parseFloat(netMargin) : undefined,
          currency: newCurrency,
          notes: econNotes.trim() || undefined,
        };
      }

      await api.updateStartupIdea(idea.id, {
        title,
        problem_statement: problem,
        proposed_solution: solution,
        target_audience: audience,
        industry,
        required_skills: skills,
        visibility,
        monthly_sales: monthlySales,
        unit_economics: unitEconomics,
      });

      setMessage('Startup idea & business traction metrics updated successfully!');
      setTimeout(() => {
        if (onUpdated) onUpdated();
        if (onIdeaUpdated) onIdeaUpdated();
        onClose();
      }, 1000);
    } catch (err: any) {
      setMessage(err.message || 'Failed to update startup idea.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 border border-slate-200 relative max-h-[92vh] flex flex-col my-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg font-bold w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100"
        >
          ✕
        </button>

        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
            ✏️
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Edit Startup Idea & Business Metrics
            </h3>
            <p className="text-xs text-slate-500">
              Log verified monthly sales, manage optional unit economics, and configure privacy
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* General info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="text-[10px] font-bold text-slate-600 uppercase">Idea Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase">Visibility</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as any)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
              >
                <option value="PUBLIC">🌐 Public</option>
                <option value="INVESTOR_ONLY">🔒 Investor-Only</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase">Industry Sector</label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase">Target Audience</label>
              <input
                type="text"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-600 uppercase">Problem Statement *</label>
            <textarea
              rows={2}
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-600 uppercase">Proposed Solution *</label>
            <textarea
              rows={2}
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-600 uppercase">Skills Required (comma-separated)</label>
            <input
              type="text"
              value={skillsStr}
              onChange={(e) => setSkillsStr(e.target.value)}
              placeholder="e.g. React, Python, Data Science, Marketing"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
            />
          </div>

          {/* Section 2: Monthly Sales Trajectory with Month/Year/Amount/Currency and Deduplication */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Monthly Sales Trajectory (persisted data only)
                </span>
                <span className="text-[11px] text-slate-500">
                  Add records by month & year. Existing month records update automatically.
                </span>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {monthlySales.length} records
              </span>
            </div>

            {/* Existing sales list */}
            {monthlySales.length === 0 ? (
              <div className="p-4 bg-white rounded-lg border border-dashed border-slate-200 text-center text-xs text-slate-400">
                Monthly sales data has not been added yet. Use the form below to publish your first sales record.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {monthlySales.map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-800">{m.month}</span>
                      <span className="font-mono text-blue-700 font-semibold">
                        {m.currency === 'USD' ? '$' : '₹'}{(m.revenue || 0).toLocaleString()}
                      </span>
                      {m.orders !== undefined && m.orders > 0 && (
                        <span className="text-slate-400 font-mono text-[11px]">
                          ({m.orders} orders)
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMonth(idx)}
                      className="text-slate-400 hover:text-red-600 px-2 py-0.5 rounded hover:bg-red-50 text-xs"
                      title="Remove record"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add/Edit record controls */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase block">
                Add or Update Month Record
              </span>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-semibold">Month</label>
                  <select
                    value={newMonth}
                    onChange={(e) => setNewMonth(e.target.value)}
                    className="w-full text-xs p-1.5 rounded-lg border border-slate-200 bg-white"
                  >
                    {MONTHS.map((mo) => (
                      <option key={mo} value={mo}>{mo}</option>
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
                    {YEARS.map((yr) => (
                      <option key={yr} value={yr}>{yr}</option>
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
                    placeholder="e.g. 250000"
                    className="w-full text-xs p-1.5 rounded-lg border border-slate-200 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-semibold">Currency</label>
                  <select
                    value={newCurrency}
                    onChange={(e) => setNewCurrency(e.target.value as any)}
                    className="w-full text-xs p-1.5 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-semibold">Orders (opt)</label>
                  <input
                    type="number"
                    min="0"
                    value={newOrders}
                    onChange={(e) => setNewOrders(e.target.value)}
                    placeholder="e.g. 150"
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
                  onClick={handleAddOrUpdateRecord}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
                >
                  + Save Month Record
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Optional Unit Economics Breakdown */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Optional Unit Economics Structure
              </span>
              <span className="text-[11px] text-slate-500">
                Leave empty if early stage. Enter per-unit metrics if your business model is established.
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
                <label className="text-[10px] font-semibold text-slate-600 uppercase">CAC (Acquisition)</label>
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
              <label className="text-[10px] font-semibold text-slate-600 uppercase">Model Assumptions / Notes (opt)</label>
              <input
                type="text"
                value={econNotes}
                onChange={(e) => setEconNotes(e.target.value)}
                placeholder="e.g. Direct-to-consumer B2B SaaS annual billing with 3-year LTV"
                className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
              />
            </div>
          </div>

          {message && (
            <p className="text-xs font-semibold text-blue-800 bg-blue-100 p-2.5 rounded-xl">
              {message}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
