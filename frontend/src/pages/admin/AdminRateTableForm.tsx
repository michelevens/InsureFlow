import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { rateTableAdminService } from '@/services/api/rateTableAdmin';
import type { CarrierOption } from '@/services/api/rateTableAdmin';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2, Upload } from 'lucide-react';

const PRODUCT_TYPES = [
  { value: 'ltc', label: 'LTC (Long-Term Care)' },
  { value: 'ltd', label: 'LTD (Long-Term Disability)' },
  { value: 'disability_ltd', label: 'Disability / LTD' },
  { value: 'life_term', label: 'Life — Term' },
  { value: 'life_whole', label: 'Life — Whole' },
  { value: 'life_universal', label: 'Life — Universal' },
  { value: 'life_final_expense', label: 'Life — Final Expense' },
  { value: 'annuity', label: 'Annuity' },
  { value: 'auto', label: 'Auto' },
  { value: 'homeowners', label: 'Homeowners' },
  { value: 'renters', label: 'Renters' },
];

const CSV_IMPORT_TYPES = [
  { value: 'entries', label: 'Rate Entries' },
  { value: 'factors', label: 'Rate Factors' },
  { value: 'riders', label: 'Riders' },
  { value: 'fees', label: 'Fees' },
];

interface FormState {
  name: string;
  product_type: string;
  version: string;
  carrier_id: string;
  description: string;
  effective_date: string;
  expiration_date: string;
  is_active: boolean;
}

interface FormErrors {
  name?: string;
  product_type?: string;
  version?: string;
}

const inputClass =
  'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-shield-500 focus:border-shield-500';

const labelClass = 'block text-sm font-medium text-slate-700 mb-1';

export default function AdminRateTableForm() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [carriers, setCarriers] = useState<CarrierOption[]>([]);
  const [form, setForm] = useState<FormState>({
    name: '',
    product_type: '',
    version: '',
    carrier_id: '',
    description: '',
    effective_date: '',
    expiration_date: '',
    is_active: true,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // CSV import state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvType, setCsvType] = useState('entries');
  const [csvUploading, setCsvUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    loadCarriers();
    if (isEdit && id) {
      loadRateTable(id);
    }
  }, [id]);

  const loadCarriers = async () => {
    try {
      const data = await rateTableAdminService.getCarriers();
      setCarriers(data);
    } catch {
      toast.error('Failed to load carriers');
    }
  };

  const loadRateTable = async (tableId: string) => {
    setLoading(true);
    try {
      const data = await rateTableAdminService.get(Number(tableId));
      setForm({
        name: data.name ?? '',
        product_type: data.product_type ?? '',
        version: data.version ?? '',
        carrier_id: data.carrier_id != null ? String(data.carrier_id) : '',
        description: data.description ?? '',
        effective_date: data.effective_date ?? '',
        expiration_date: data.expiration_date ?? '',
        is_active: data.is_active ?? true,
      });
    } catch {
      toast.error('Failed to load rate table');
      navigate('/admin/rate-tables');
    } finally {
      setLoading(false);
    }
  };

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!form.name.trim()) next.name = 'Name is required.';
    if (!form.product_type) next.product_type = 'Product type is required.';
    if (!form.version.trim()) next.version = 'Version is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (key in errors) {
      setErrors(prev => ({ ...prev, [key]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      product_type: form.product_type,
      version: form.version.trim(),
      carrier_id: form.carrier_id ? Number(form.carrier_id) : null,
      description: form.description.trim() || null,
      effective_date: form.effective_date || null,
      expiration_date: form.expiration_date || null,
      is_active: form.is_active,
    };

    try {
      if (isEdit && id) {
        await rateTableAdminService.update(Number(id!), payload);
        toast.success('Rate table updated');
        navigate('/admin/rate-tables');
      } else {
        await rateTableAdminService.create(payload);
        toast.success('Rate table created');
        navigate('/admin/rate-tables');
      }
    } catch {
      toast.error('Failed to save rate table');
    } finally {
      setSaving(false);
    }
  };

  // CSV import handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      setCsvFile(file);
    } else {
      toast.error('Please drop a CSV file');
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile || !id) return;
    setCsvUploading(true);
    try {
      await rateTableAdminService.importCsv(Number(id!), csvFile, csvType);
      toast.success(`CSV imported as "${csvType}" successfully`);
      setCsvFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch {
      toast.error('CSV import failed');
    } finally {
      setCsvUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-shield-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Back link */}
      <button
        type="button"
        onClick={() => navigate('/admin/rate-tables')}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {isEdit ? 'Back' : 'Back to Rate Tables'}
      </button>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {isEdit ? 'Edit Rate Table' : 'New Rate Table'}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {isEdit ? 'Update the rate table details below.' : 'Fill in the details to create a new rate table.'}
        </p>
      </div>

      {/* Main form card */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
          {/* Name */}
          <div>
            <label className={labelClass}>Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.name}
              onChange={e => handleChange('name', e.target.value)}
              className={inputClass}
              placeholder="e.g. Standard LTC Rates"
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>

          {/* Product Type + Version */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Product Type <span className="text-red-500">*</span></label>
              <select
                value={form.product_type}
                onChange={e => handleChange('product_type', e.target.value)}
                className={inputClass}
              >
                <option value="">Select type…</option>
                {PRODUCT_TYPES.map(pt => (
                  <option key={pt.value} value={pt.value}>{pt.label}</option>
                ))}
              </select>
              {errors.product_type && <p className="mt-1 text-xs text-red-500">{errors.product_type}</p>}
            </div>

            <div>
              <label className={labelClass}>Version <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.version}
                onChange={e => handleChange('version', e.target.value)}
                className={inputClass}
                placeholder="e.g. 2026-Q1"
              />
              {errors.version && <p className="mt-1 text-xs text-red-500">{errors.version}</p>}
            </div>
          </div>

          {/* Carrier */}
          <div>
            <label className={labelClass}>Carrier <span className="text-slate-400 font-normal">(optional — leave blank for generic)</span></label>
            <select
              value={form.carrier_id}
              onChange={e => handleChange('carrier_id', e.target.value)}
              className={inputClass}
            >
              <option value="">Generic (no carrier)</option>
              {carriers.map(c => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={form.description}
              onChange={e => handleChange('description', e.target.value)}
              className={`${inputClass} min-h-[80px] resize-y`}
              placeholder="Optional notes about this rate table…"
            />
          </div>

          {/* Effective / Expiration dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Effective Date</label>
              <input
                type="date"
                value={form.effective_date}
                onChange={e => handleChange('effective_date', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Expiration Date <span className="text-slate-400 font-normal">(optional)</span></label>
              <input
                type="date"
                value={form.expiration_date}
                onChange={e => handleChange('expiration_date', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Is Active toggle */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={e => handleChange('is_active', e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-shield-600 focus:ring-shield-500"
            />
            <span className="text-sm font-medium text-slate-700">Active</span>
            <span className="text-xs text-slate-400">(only active tables are used in quoting)</span>
          </label>

          {/* Submit */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 bg-shield-600 text-white hover:bg-shield-700 disabled:opacity-60 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Saving…' : isEdit ? 'Update Rate Table' : 'Create Rate Table'}
            </button>
          </div>
        </div>
      </form>

      {/* CSV Import — edit mode only */}
      {isEdit && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-900">Import CSV Data</h2>
          <p className="text-sm text-slate-500">Upload a CSV file to populate rate entries, factors, riders, or fees for this table.</p>

          {/* Type selector */}
          <div>
            <label className={labelClass}>Import Type</label>
            <select
              value={csvType}
              onChange={e => setCsvType(e.target.value)}
              className={inputClass}
            >
              {CSV_IMPORT_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg py-8 cursor-pointer transition-colors ${
              isDragging ? 'border-shield-400 bg-shield-50' : 'border-slate-300 hover:border-shield-400 hover:bg-slate-50'
            }`}
          >
            <Upload className="h-7 w-7 text-slate-400" />
            {csvFile ? (
              <p className="text-sm font-medium text-slate-700">{csvFile.name}</p>
            ) : (
              <>
                <p className="text-sm font-medium text-slate-700">Drop a CSV file here, or click to browse</p>
                <p className="text-xs text-slate-400">Only .csv files are accepted</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) setCsvFile(file);
              }}
            />
          </div>

          {/* Upload button */}
          <div className="flex justify-end">
            <button
              type="button"
              disabled={!csvFile || csvUploading}
              onClick={handleCsvUpload}
              className="inline-flex items-center gap-2 bg-shield-600 text-white hover:bg-shield-700 disabled:opacity-60 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {csvUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {csvUploading ? 'Uploading…' : 'Upload CSV'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
