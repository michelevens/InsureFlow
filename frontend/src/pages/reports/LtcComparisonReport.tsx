import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, Button } from '@/components/ui';
import { Printer, Download, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { api } from '@/services/api/client';

interface CarrierColumn {
  rating_run_id: number;
  carrier_name: string;
  product_name: string;
  rate_table_version: string | null;
  issue_age: number | null;
  sex: string | null;
  uw_class: string;
  tax_qualified: boolean;
  facility_daily_benefit: number;
  benefit_period: string;
  benefit_period_days: number | null;
  pool_of_money: number | null;
  home_care_daily_benefit: string;
  home_care_type: string;
  home_care_benefit_period: string;
  cash_benefit: boolean;
  inflation_protection: string;
  inflation_duration: string;
  elimination_period: string;
  nonforfeiture: string;
  restoration: boolean;
  spouse_waiver: boolean;
  marital_discount: string;
  payment_option: string;
  modal_factor: string;
  partnership_plan: boolean;
  assisted_living: string;
  waiver_of_premium: string;
  joint_applicant: boolean;
  monthly_benefit_age_80: number | null;
  daily_benefit_age_80: number | null;
  total_benefit_age_80: number | null;
  premium: number;
  premium_modal: number;
}

interface AgencyInfo {
  name: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
}

interface ComparisonData {
  client: { name: string; state: string | null; dob: string | null };
  prepared_by: { name: string; email: string };
  agency: AgencyInfo | null;
  date: string;
  carriers: CarrierColumn[];
  combined_premiums: Record<string, number>;
}

const formatCurrency = (v: number | null | undefined) =>
  v != null ? `$${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-';

const formatLabel = (v: string | null | undefined) => {
  if (!v) return '-';
  return v.replace(/_/g, ' ').replace(/pct/g, '%').replace(/(\d)yr/, '$1 Year').replace('compound', 'Compound');
};

const yesNo = (v: boolean | null | undefined) => v ? 'Yes' : 'No';

export default function LtcComparisonReport() {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadComparison();
  }, []);

  const loadComparison = async () => {
    const runsParam = searchParams.get('runs');
    if (!runsParam) {
      setError('No rating runs specified. Add ?runs=1,2,3 to the URL.');
      setLoading(false);
      return;
    }

    const runIds = runsParam.split(',').map(Number).filter(n => !isNaN(n));
    if (runIds.length === 0) {
      setError('Invalid run IDs.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await api.post<ComparisonData>('/reports/ltc-comparison', {
        rating_run_ids: runIds,
        client_name: searchParams.get('client') || undefined,
        client_state: searchParams.get('state') || undefined,
      });
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate comparison');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">LTC Carrier Comparison</h1>
        <Card className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-shield-500 mx-auto" />
          <p className="text-slate-500 mt-2">Generating comparison report...</p>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">LTC Carrier Comparison</h1>
        <Card className="p-8 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-500">{error || 'No data available'}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={loadComparison}>Retry</Button>
        </Card>
      </div>
    );
  }

  const { carriers, agency } = data;

  const rows: { label: string; key: string; format: (c: CarrierColumn) => string }[] = [
    { label: 'Carrier', key: 'carrier_name', format: c => c.carrier_name },
    { label: 'Product', key: 'product_name', format: c => c.product_name },
    { label: 'Issue Age', key: 'issue_age', format: c => String(c.issue_age || '-') },
    { label: 'Gender', key: 'sex', format: c => c.sex === 'M' ? 'Male' : c.sex === 'F' ? 'Female' : '-' },
    { label: 'UW Class', key: 'uw_class', format: c => formatLabel(c.uw_class) },
    { label: 'Tax Qualified', key: 'tax_qualified', format: c => yesNo(c.tax_qualified) },
    { label: 'Facility Daily Benefit', key: 'facility_daily_benefit', format: c => formatCurrency(c.facility_daily_benefit) },
    { label: 'Benefit Period', key: 'benefit_period', format: c => formatLabel(c.benefit_period) },
    { label: 'Pool of Money', key: 'pool_of_money', format: c => formatCurrency(c.pool_of_money) },
    { label: 'Home Care Benefit', key: 'home_care_daily_benefit', format: c => formatLabel(c.home_care_daily_benefit) },
    { label: 'Home Care Type', key: 'home_care_type', format: c => formatLabel(c.home_care_type) },
    { label: 'Home Care Benefit Period', key: 'home_care_benefit_period', format: c => formatLabel(c.home_care_benefit_period) },
    { label: 'Cash Benefit', key: 'cash_benefit', format: c => c.cash_benefit ? '25%' : 'N/A' },
    { label: 'Inflation Protection', key: 'inflation_protection', format: c => formatLabel(c.inflation_protection) },
    { label: 'Inflation Duration', key: 'inflation_duration', format: c => formatLabel(c.inflation_duration) },
    { label: 'Elimination Period', key: 'elimination_period', format: c => `${c.elimination_period} days` },
    { label: 'Nonforfeiture', key: 'nonforfeiture', format: c => formatLabel(c.nonforfeiture) },
    { label: 'Restoration of Benefit', key: 'restoration', format: c => yesNo(c.restoration) },
    { label: 'Spouse Premium Waiver', key: 'spouse_waiver', format: c => yesNo(c.spouse_waiver) },
    { label: 'Marital Discount', key: 'marital_discount', format: c => formatLabel(c.marital_discount) },
    { label: 'Payment Option', key: 'payment_option', format: c => formatLabel(c.payment_option) },
    { label: 'Partnership Plan', key: 'partnership_plan', format: c => yesNo(c.partnership_plan) },
    { label: 'Assisted Living', key: 'assisted_living', format: c => formatLabel(c.assisted_living) },
    { label: 'Waiver of Premium', key: 'waiver_of_premium', format: c => formatLabel(c.waiver_of_premium) },
    { label: 'Joint Applicant', key: 'joint_applicant', format: c => yesNo(c.joint_applicant) },
  ];

  const projectionRows: { label: string; format: (c: CarrierColumn) => string }[] = [
    { label: 'Monthly Benefit at Age 80', format: c => formatCurrency(c.monthly_benefit_age_80) },
    { label: 'Daily Benefit at Age 80', format: c => formatCurrency(c.daily_benefit_age_80) },
    { label: 'Total Benefit at Age 80', format: c => formatCurrency(c.total_benefit_age_80) },
  ];

  return (
    <>
      {/* Print-only styles */}
      <style>{`
        @media print {
          /* Hide sidebar, top bar, and nav */
          aside, header, nav, .lg\\:ml-64 > div:first-child { display: none !important; }
          .lg\\:ml-64 { margin-left: 0 !important; }
          main { padding: 0 !important; }
          main > div { padding: 0 !important; }

          /* Page setup */
          @page {
            size: landscape;
            margin: 0.5in 0.4in 0.75in 0.4in;
          }

          /* Ensure colors print */
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }

          /* Table fits page */
          table { font-size: 9pt !important; }
          td, th { padding: 4px 6px !important; }
        }
      `}</style>

      <div className="space-y-6 print:space-y-3">
        {/* ===== SCREEN-ONLY: Action bar ===== */}
        <div className="flex items-center justify-between print:hidden">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Long Term Care — Carrier Comparison</h1>
            <p className="text-slate-500 mt-1">Side-by-side carrier analysis</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" leftIcon={<Printer className="w-4 h-4" />} onClick={() => window.print()}>
              Print
            </Button>
            <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />} onClick={() => window.print()}>
              Export PDF
            </Button>
          </div>
        </div>

        {/* ===== PRINT HEADER: Agency branding ===== */}
        <div className="hidden print:block">
          <div className="flex items-start justify-between border-b-2 border-slate-800 pb-3 mb-4">
            <div>
              {agency ? (
                <>
                  <h1 className="text-xl font-bold text-slate-900">{agency.name}</h1>
                  {agency.address && <p className="text-xs text-slate-600">{agency.address}</p>}
                  <div className="flex gap-4 mt-1">
                    {agency.phone && <p className="text-xs text-slate-600">{agency.phone}</p>}
                    {agency.email && <p className="text-xs text-slate-600">{agency.email}</p>}
                    {agency.website && <p className="text-xs text-slate-600">{agency.website}</p>}
                  </div>
                </>
              ) : (
                <h1 className="text-xl font-bold text-slate-900">Long Term Care Comparison</h1>
              )}
            </div>
            <div className="text-right">
              <h2 className="text-lg font-bold text-slate-800">LTC Carrier Comparison</h2>
              <p className="text-xs text-slate-500">Report Date: {data.date}</p>
            </div>
          </div>
        </div>

        {/* ===== Client & Prepared By info ===== */}
        <Card className="print:shadow-none print:border print:rounded-none">
          <div className="p-6 print:p-3 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Client</p>
              <p className="font-semibold text-slate-900">{data.client.name}</p>
              {data.client.state && <p className="text-sm text-slate-600">State: {data.client.state}</p>}
              {data.client.dob && <p className="text-sm text-slate-600">DOB: {data.client.dob}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Prepared By</p>
              <p className="font-semibold text-slate-900">{data.prepared_by.name}</p>
              <p className="text-sm text-slate-600">{data.prepared_by.email}</p>
              <p className="text-sm text-slate-600 print:hidden">{data.date}</p>
            </div>
          </div>
        </Card>

        {/* ===== Comparison Table ===== */}
        <Card className="print:shadow-none print:border print:rounded-none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-shield-200 bg-shield-50">
                  <th className="text-left p-3 font-semibold text-shield-700 w-56 print:w-44">Parameter</th>
                  {carriers.map((c, i) => (
                    <th key={i} className="text-center p-3 font-semibold text-shield-700 min-w-[180px] print:min-w-0">
                      <div className="flex items-center justify-center gap-2">
                        <ShieldCheck className="w-4 h-4 print:hidden" />
                        {c.carrier_name}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={row.key} className={ri % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="p-3 font-medium text-slate-700">{row.label}</td>
                    {carriers.map((c, ci) => (
                      <td key={ci} className="p-3 text-center text-slate-900">{row.format(c)}</td>
                    ))}
                  </tr>
                ))}

                {/* Projections section */}
                <tr className="border-t-2 border-shield-200 bg-shield-50">
                  <td colSpan={carriers.length + 1} className="p-3 font-semibold text-shield-700">
                    Benefit Projections
                  </td>
                </tr>
                {projectionRows.map((row, ri) => (
                  <tr key={`proj-${ri}`} className={ri % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="p-3 font-medium text-slate-700">{row.label}</td>
                    {carriers.map((c, ci) => (
                      <td key={ci} className="p-3 text-center text-slate-900">{row.format(c)}</td>
                    ))}
                  </tr>
                ))}

                {/* Premium section */}
                <tr className="border-t-2 border-savings-200 bg-savings-50">
                  <td colSpan={carriers.length + 1} className="p-3 font-semibold text-savings-700">
                    Premium
                  </td>
                </tr>
                <tr className="bg-white">
                  <td className="p-3 font-semibold text-slate-900">Annual Premium</td>
                  {carriers.map((c, ci) => (
                    <td key={ci} className="p-3 text-center font-bold text-lg text-savings-700">
                      {formatCurrency(c.premium)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* ===== Combined premiums summary ===== */}
        {Object.keys(data.combined_premiums).length > 0 && (
          <Card className="print:shadow-none print:border print:rounded-none">
            <div className="p-6 print:p-3">
              <h3 className="font-semibold text-slate-900 mb-3">Combined Annual Premiums</h3>
              <div className="grid grid-cols-3 gap-4 print:gap-2">
                {Object.entries(data.combined_premiums).map(([key, total]) => (
                  <div key={key} className="text-center p-4 print:p-2 rounded-xl bg-slate-50">
                    <p className="text-sm text-slate-500 capitalize">{key.replace(/_/g, ' ')}</p>
                    <p className="text-2xl print:text-lg font-bold text-savings-600">{formatCurrency(total)}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* ===== PRINT FOOTER: Platform info + Disclaimer ===== */}
        <div className="hidden print:block mt-6 pt-4 border-t border-slate-300">
          {/* Disclaimer */}
          <div className="mb-4">
            <p className="text-[8pt] leading-tight text-slate-500">
              <span className="font-semibold text-slate-600">Disclaimer:</span> This comparison report is provided for informational and illustrative purposes only.
              Premium rates shown are estimates based on the information provided and may differ from final carrier quotes.
              Actual premiums are subject to underwriting approval and may vary based on health status, medical history,
              and other factors determined by the issuing carrier. Benefits, features, and availability may vary by state.
              This report does not constitute an offer of insurance, a guarantee of coverage, or financial advice.
              Please consult with a licensed insurance professional and review the actual policy contract for complete
              terms, conditions, limitations, and exclusions before making any purchase decision.
            </p>
          </div>

          {/* Platform info */}
          <div className="flex items-center justify-between text-[8pt] text-slate-400">
            <div>
              <p>Powered by <span className="font-semibold">Insurons</span> — Insurance Technology Platform</p>
              <p>www.insurons.com</p>
            </div>
            <div className="text-right">
              <p>Report generated: {data.date}</p>
              <p>Confidential — Prepared for {data.client.name}</p>
            </div>
          </div>
        </div>

        {/* ===== SCREEN-ONLY: Disclaimer notice ===== */}
        <div className="print:hidden">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-xs text-slate-500 leading-relaxed">
              <span className="font-semibold text-slate-600">Disclaimer:</span> This comparison is for informational purposes only.
              Premium rates are estimates and may differ from final carrier quotes. Actual premiums are subject to underwriting
              approval. Benefits and availability may vary by state. This does not constitute an offer of insurance or financial advice.
              Please review actual policy contracts for complete terms and conditions.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
