import React from 'react';
import { MonthlySalesData, UnitEconomicsData } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

interface FinancialChartsProps {
  monthlySales?: MonthlySalesData[] | MonthlySalesData;
  unitEconomics?: UnitEconomicsData;
  visibility?: string;
  currency?: string;
  isOwner?: boolean;
}

export const FinancialCharts: React.FC<FinancialChartsProps> = ({
  monthlySales,
  unitEconomics,
  visibility = 'PUBLIC',
  currency = 'INR',
  isOwner = false,
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();

  const isInvestorOrOwner = Boolean(
    isOwner ||
    user?.role === 'investor' ||
    user?.role === 'admin'
  );

  const isRestricted = (visibility === 'INVESTOR_ONLY' && !isInvestorOrOwner);

  const rawSales: MonthlySalesData[] = Array.isArray(monthlySales)
    ? monthlySales
    : monthlySales
    ? [monthlySales]
    : [];

  const salesCurrency = rawSales[0]?.currency || currency || 'INR';
  const symbol = salesCurrency === 'USD' ? '$' : '₹';

  // Check if unit economics actually has valid data
  const hasUnitEconomics = Boolean(
    unitEconomics && (
      (unitEconomics.revenue_per_unit && unitEconomics.revenue_per_unit > 0) ||
      (unitEconomics.cac && unitEconomics.cac > 0) ||
      (unitEconomics.cogs && unitEconomics.cogs > 0) ||
      (unitEconomics.logistics && unitEconomics.logistics > 0) ||
      (unitEconomics.net_margin && unitEconomics.net_margin > 0) ||
      (unitEconomics.gross_margin && unitEconomics.gross_margin > 0)
    )
  );

  if (isRestricted) {
    return (
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 text-center shadow-xs">
        <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-2 text-lg font-bold">
          🔒
        </div>
        <h4 className="text-sm font-bold text-slate-800 mb-1">Confidential Financials</h4>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          Startup financials and traction data are restricted to verified investors and founders.
        </p>
      </div>
    );
  }

  const maxRevenue = rawSales.length > 0 ? Math.max(...rawSales.map((s) => s.revenue || 0), 1) : 1;

  // Build slices for unit economics if present
  const econSlices: Array<{ label: string; amount: number; color: string }> = [];
  if (hasUnitEconomics && unitEconomics) {
    if (unitEconomics.cac) econSlices.push({ label: 'CAC (Acquisition)', amount: unitEconomics.cac, color: '#F59E0B' }); // Amber
    if (unitEconomics.cogs) econSlices.push({ label: 'COGS (Direct Costs)', amount: unitEconomics.cogs, color: '#1D4ED8' }); // Royal Blue
    if (unitEconomics.logistics) econSlices.push({ label: 'Logistics / Fulfillment', amount: unitEconomics.logistics, color: '#6366F1' }); // Indigo
    if (unitEconomics.net_margin) econSlices.push({ label: 'Net Profit Margin', amount: unitEconomics.net_margin, color: '#10B981' }); // Emerald
  }

  const totalPerUnit = econSlices.reduce((acc, s) => acc + s.amount, 0);

  let cumulativeAngle = 0;
  const pieSlices = econSlices.map((s) => {
    const fraction = totalPerUnit > 0 ? s.amount / totalPerUnit : 0;
    const angle = fraction * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle += angle;

    const startRad = ((startAngle - 90) * Math.PI) / 180.0;
    const endRad = ((endAngle - 90) * Math.PI) / 180.0;
    const x1 = 100 + 75 * Math.cos(startRad);
    const y1 = 100 + 75 * Math.sin(startRad);
    const x2 = 100 + 75 * Math.cos(endRad);
    const y2 = 100 + 75 * Math.sin(endRad);
    const largeArc = angle > 180 ? 1 : 0;
    const pathData = `M 100 100 L ${x1} ${y1} A 75 75 0 ${largeArc} 1 ${x2} ${y2} Z`;

    return {
      ...s,
      fraction,
      percentage: Math.round(fraction * 100),
      pathData,
    };
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            📊 {t('financials.title', 'Startup Traction & Financial Model')}
          </h3>
          <p className="text-xs text-slate-500">
            Historical sales records & optional unit economics margin structure
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              visibility === 'INVESTOR_ONLY'
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-blue-100 text-blue-800 border border-blue-200'
            }`}
          >
            {visibility === 'INVESTOR_ONLY' ? '🔒 Investor-Only Access' : '🌐 Public Financials'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Monthly Revenue Bar Chart */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-slate-800">
              {t('financials.monthlySales', 'Monthly Revenue Trajectory')}
            </span>
            {rawSales.length > 0 && (
              <span className="text-[11px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Peak: {symbol}{maxRevenue.toLocaleString()}
              </span>
            )}
          </div>

          {rawSales.length === 0 ? (
            <div className="py-12 px-4 text-center flex flex-col items-center justify-center my-auto">
              <span className="text-2xl mb-2">📈</span>
              <p className="text-xs font-bold text-slate-700">Monthly sales data has not been added yet</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                The founder has not published monthly sales records for this venture yet.
              </p>
            </div>
          ) : (
            <>
              {/* SVG Bar Chart */}
              <div className="h-44 w-full flex items-end gap-3 pt-6 pb-2 px-2">
                {rawSales.map((item, idx) => {
                  const heightPct = Math.max(12, Math.round(((item.revenue || 0) / maxRevenue) * 100));
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                      {/* Tooltip on hover */}
                      <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-10">
                        {symbol}{(item.revenue || 0).toLocaleString()} {item.orders ? `(${item.orders} orders)` : ''}
                      </div>

                      {/* Revenue Bar */}
                      <div
                        className="w-full bg-gradient-to-t from-blue-700 to-blue-500 rounded-t-md transition-all duration-300 group-hover:from-blue-600 group-hover:to-blue-400"
                        style={{ height: `${heightPct}%` }}
                      />

                      {/* Month Label */}
                      <span className="text-[10px] text-slate-500 mt-2 truncate w-full text-center">
                        {item.month}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center text-[11px] text-slate-500 border-t border-slate-200 pt-2 mt-1">
                <span>Verified founder sales records</span>
                <span className="text-blue-700 font-semibold font-mono">
                  Latest: {symbol}{(rawSales[rawSales.length - 1]?.revenue || 0).toLocaleString()}
                </span>
              </div>
            </>
          )}
        </div>

        {/* 2. Unit Economics Donut Chart / Optional State */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-800">
              {t('financials.unitEconomics', 'Unit Economics Breakdown')}
            </span>
            {hasUnitEconomics && unitEconomics?.revenue_per_unit && (
              <span className="text-[11px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Rev/Unit: {symbol}{unitEconomics.revenue_per_unit.toLocaleString()}
              </span>
            )}
          </div>

          {!hasUnitEconomics ? (
            <div className="py-12 px-4 text-center flex flex-col items-center justify-center my-auto">
              <span className="text-2xl mb-2">🏷️</span>
              <p className="text-xs font-bold text-slate-700">Optional unit economics data has not been added yet</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                Per-unit cost and margin details can be optionally published by the founder.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 my-auto py-2">
                {/* Donut SVG */}
                <div className="w-32 h-32 relative shrink-0">
                  <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                    {pieSlices.map((slice, i) => (
                      <path
                        key={i}
                        d={slice.pathData}
                        fill={slice.color}
                        className="transition-opacity hover:opacity-85 cursor-pointer"
                      >
                        <title>{`${slice.label}: ${symbol}${slice.amount} (${slice.percentage}%)`}</title>
                      </path>
                    ))}
                    {/* Donut center cutout */}
                    <circle cx="100" cy="100" r="45" fill="#F8FAFC" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Total Cost</span>
                    <span className="text-xs font-extrabold text-slate-900 font-mono">
                      {symbol}{totalPerUnit.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Legend & Breakdown */}
                <div className="space-y-1.5 flex-1 text-xs">
                  {pieSlices.map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                        <span className="text-[11px] text-slate-700 truncate max-w-[120px]">{s.label}</span>
                      </div>
                      <div className="text-right font-mono text-[11px] font-semibold text-slate-900">
                        {symbol}{s.amount.toLocaleString()} <span className="text-slate-400 font-normal">({s.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {unitEconomics?.notes && (
                <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200 mt-2 italic">
                  "{unitEconomics.notes}"
                </p>
              )}

              <div className="flex justify-between items-center text-[11px] text-slate-500 border-t border-slate-200 pt-2 mt-2">
                <span>Unit Economics Model</span>
                {unitEconomics?.net_margin && (
                  <span className="text-emerald-700 font-semibold font-mono">
                    Net Margin: {symbol}{unitEconomics.net_margin.toLocaleString()}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
