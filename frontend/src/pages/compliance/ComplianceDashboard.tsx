import { useState, useEffect } from 'react';
import { Card, Badge, Button, Input, Modal, Select } from '@/components/ui';
import { complianceService } from '@/services/api';
import type { ComplianceDashboard as DashboardData } from '@/services/api/compliance';
import {
  ShieldCheck, Award, FileText, AlertTriangle, Plus, Trash2, Clock,
} from 'lucide-react';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
];

const licenseStatusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' }> = {
  active: { label: 'Active', variant: 'success' },
  expired: { label: 'Expired', variant: 'danger' },
  suspended: { label: 'Suspended', variant: 'warning' },
  revoked: { label: 'Revoked', variant: 'danger' },
  pending: { label: 'Pending', variant: 'info' },
};

type Tab = 'overview' | 'licenses' | 'ce' | 'eo';

export default function ComplianceDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [showAddLicense, setShowAddLicense] = useState(false);
  const [showAddCe, setShowAddCe] = useState(false);
  const [showAddEo, setShowAddEo] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const d = await complianceService.dashboard();
      setData(d);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const deleteLicense = async (id: number) => {
    await complianceService.removeLicense(id);
    fetchData();
  };

  const deleteCe = async (id: number) => {
    await complianceService.removeCeCredit(id);
    fetchData();
  };

  const deleteEo = async (id: number) => {
    await complianceService.removeEoPolicy(id);
    fetchData();
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'licenses', label: 'Licenses' },
    { key: 'ce', label: 'CE Credits' },
    { key: 'eo', label: 'E&O Insurance' },
  ];

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Compliance</h1>
        <Card className="p-8 text-center">
          <div className="w-8 h-8 border-4 border-shield-200 border-t-shield-600 rounded-full animate-spin mx-auto" />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Compliance</h1>
          <p className="text-slate-500 mt-1">Licenses, CE credits, and E&O insurance tracking</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 rounded-lg p-1 w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${activeTab === t.key ? 'bg-white shadow text-slate-900 font-medium' : 'text-slate-500'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-shield-50 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-shield-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{data.licenses.active}</p>
                  <p className="text-sm text-slate-500">Active Licenses</p>
                </div>
              </div>
              {data.licenses.expiring_soon > 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  <AlertTriangle className="w-3 h-3 inline mr-1" />{data.licenses.expiring_soon} expiring soon
                </p>
              )}
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Award className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{data.ce_credits.this_year}h</p>
                  <p className="text-sm text-slate-500">CE This Year</p>
                </div>
              </div>
              <p className="text-xs text-slate-400">{data.ce_credits.total_hours}h total</p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${data.eo_insurance.active ? 'bg-green-50' : 'bg-red-50'}`}>
                  <FileText className={`w-5 h-5 ${data.eo_insurance.active ? 'text-green-600' : 'text-red-600'}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{data.eo_insurance.active ? 'Active' : 'None'}</p>
                  <p className="text-sm text-slate-500">E&O Insurance</p>
                </div>
              </div>
              {data.eo_insurance.policy && (
                <p className="text-xs text-slate-400">Expires {new Date(data.eo_insurance.policy.expiration_date).toLocaleDateString()}</p>
              )}
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${data.expiring.length > 0 ? 'bg-amber-50' : 'bg-green-50'}`}>
                  <Clock className={`w-5 h-5 ${data.expiring.length > 0 ? 'text-amber-600' : 'text-green-600'}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{data.expiring.length}</p>
                  <p className="text-sm text-slate-500">Expiring Items</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Expiring items */}
          {data.expiring.length > 0 && (
            <Card className="p-5">
              <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Expiring Soon
              </h3>
              <div className="space-y-2">
                {data.expiring.map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-amber-50 rounded-lg px-4 py-2.5 text-sm">
                    <div>
                      <span className="font-medium">{item.label}</span>
                      <span className="text-slate-400 ml-2">expires {item.expires}</span>
                    </div>
                    <Badge variant={item.days_left <= 14 ? 'danger' : 'warning'}>
                      {item.days_left} days
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {activeTab === 'licenses' && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900">Agent Licenses</h3>
            <Button variant="shield" size="sm" onClick={() => setShowAddLicense(true)}>
              <Plus className="w-4 h-4 mr-1" /> Add License
            </Button>
          </div>
          {data.licenses.items.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No licenses on file</p>
          ) : (
            <div className="space-y-2">
              {data.licenses.items.map(l => {
                const sc = licenseStatusConfig[l.status] || licenseStatusConfig.pending;
                return (
                  <div key={l.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg text-slate-900">{l.state}</span>
                        <Badge variant={sc.variant}>{sc.label}</Badge>
                        <span className="text-sm text-slate-500">{l.license_type}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                        <span>#{l.license_number}</span>
                        {l.npn && <span>NPN: {l.npn}</span>}
                        <span>Expires: {new Date(l.expiration_date).toLocaleDateString()}</span>
                      </div>
                      {l.lines_of_authority && l.lines_of_authority.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {l.lines_of_authority.map(loa => (
                            <span key={loa} className="text-xs px-2 py-0.5 rounded-full bg-shield-50 text-shield-700 capitalize">{loa}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => deleteLicense(l.id)}>
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {activeTab === 'ce' && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900">CE Credits</h3>
            <Button variant="shield" size="sm" onClick={() => setShowAddCe(true)}>
              <Plus className="w-4 h-4 mr-1" /> Add CE Credit
            </Button>
          </div>
          {data.ce_credits.items.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No CE credits recorded</p>
          ) : (
            <div className="space-y-2">
              {data.ce_credits.items.map(c => (
                <div key={c.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
                  <div>
                    <p className="font-medium text-slate-900">{c.course_name}</p>
                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                      <span className="font-bold text-shield-600">{c.hours}h</span>
                      {c.provider && <span>{c.provider}</span>}
                      {c.category && <span className="capitalize">{c.category}</span>}
                      {c.state && <span>{c.state}</span>}
                      <span>{new Date(c.completion_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => deleteCe(c.id)}>
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === 'eo' && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900">E&O Insurance</h3>
            <Button variant="shield" size="sm" onClick={() => setShowAddEo(true)}>
              <Plus className="w-4 h-4 mr-1" /> Add E&O Policy
            </Button>
          </div>
          {!data.eo_insurance.policy ? (
            <div className="text-center py-8">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No E&O policy on file</p>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-bold text-slate-900">{data.eo_insurance.policy.carrier}</h4>
                    <Badge variant={data.eo_insurance.active ? 'success' : 'danger'}>
                      {data.eo_insurance.active ? 'Active' : 'Expired'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                    <div>
                      <span className="text-slate-400">Policy #</span>
                      <p className="font-medium">{data.eo_insurance.policy.policy_number}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Coverage</span>
                      <p className="font-medium">${Number(data.eo_insurance.policy.coverage_amount).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Effective</span>
                      <p className="font-medium">{new Date(data.eo_insurance.policy.effective_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Expires</span>
                      <p className="font-medium">{new Date(data.eo_insurance.policy.expiration_date).toLocaleDateString()}</p>
                    </div>
                    {data.eo_insurance.policy.deductible && (
                      <div>
                        <span className="text-slate-400">Deductible</span>
                        <p className="font-medium">${Number(data.eo_insurance.policy.deductible).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => deleteEo(data.eo_insurance.policy!.id)}>
                  <Trash2 className="w-4 h-4 text-red-400" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Add License Modal */}
      {showAddLicense && (
        <AddLicenseModal onClose={() => setShowAddLicense(false)} onAdded={() => { fetchData(); setShowAddLicense(false); }} />
      )}

      {/* Add CE Credit Modal */}
      {showAddCe && (
        <AddCeCreditModal onClose={() => setShowAddCe(false)} onAdded={() => { fetchData(); setShowAddCe(false); }} />
      )}

      {/* Add E&O Modal */}
      {showAddEo && (
        <AddEoPolicyModal onClose={() => setShowAddEo(false)} onAdded={() => { fetchData(); setShowAddEo(false); }} />
      )}
    </div>
  );
}

function AddLicenseModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [state, setState] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseType, setLicenseType] = useState('producer');
  const [expirationDate, setExpirationDate] = useState('');
  const [npn, setNpn] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!state || !licenseNumber || !expirationDate) return;
    setSaving(true);
    try {
      await complianceService.createLicense({
        state,
        license_number: licenseNumber,
        license_type: licenseType,
        expiration_date: expirationDate,
        npn: npn || undefined,
      });
      onAdded();
    } catch {
      // handle
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Add License" size="md">
      <div className="space-y-4">
        <Select
          label="State"
          value={state}
          onChange={e => setState(e.target.value)}
          options={[{ value: '', label: 'Select state...' }, ...US_STATES.map(s => ({ value: s, label: s }))]}
        />
        <Input label="License Number" value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} />
        <Select
          label="License Type"
          value={licenseType}
          onChange={e => setLicenseType(e.target.value)}
          options={[
            { value: 'producer', label: 'Producer' },
            { value: 'surplus_lines', label: 'Surplus Lines' },
            { value: 'adjuster', label: 'Adjuster' },
          ]}
        />
        <Input label="Expiration Date" type="date" value={expirationDate} onChange={e => setExpirationDate(e.target.value)} />
        <Input label="NPN (optional)" value={npn} onChange={e => setNpn(e.target.value)} placeholder="National Producer Number" />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="shield" onClick={handleSubmit} disabled={saving || !state || !licenseNumber || !expirationDate}>
            {saving ? 'Adding...' : 'Add License'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function AddCeCreditModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [courseName, setCourseName] = useState('');
  const [provider, setProvider] = useState('');
  const [hours, setHours] = useState('');
  const [category, setCategory] = useState('');
  const [completionDate, setCompletionDate] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!courseName || !hours || !completionDate) return;
    setSaving(true);
    try {
      await complianceService.createCeCredit({
        course_name: courseName,
        provider: provider || undefined,
        hours: parseFloat(hours),
        category: category || undefined,
        completion_date: completionDate,
      });
      onAdded();
    } catch {
      // handle
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Add CE Credit" size="md">
      <div className="space-y-4">
        <Input label="Course Name" value={courseName} onChange={e => setCourseName(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Provider" value={provider} onChange={e => setProvider(e.target.value)} />
          <Input label="Hours" type="number" value={hours} onChange={e => setHours(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Category"
            value={category}
            onChange={e => setCategory(e.target.value)}
            options={[
              { value: '', label: 'Select...' },
              { value: 'general', label: 'General' },
              { value: 'ethics', label: 'Ethics' },
              { value: 'flood', label: 'Flood' },
              { value: 'long_term_care', label: 'Long-Term Care' },
            ]}
          />
          <Input label="Completion Date" type="date" value={completionDate} onChange={e => setCompletionDate(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="shield" onClick={handleSubmit} disabled={saving || !courseName || !hours || !completionDate}>
            {saving ? 'Adding...' : 'Add CE Credit'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function AddEoPolicyModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [carrier, setCarrier] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [coverageAmount, setCoverageAmount] = useState('');
  const [deductible, setDeductible] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!carrier || !policyNumber || !coverageAmount || !effectiveDate || !expirationDate) return;
    setSaving(true);
    try {
      await complianceService.createEoPolicy({
        carrier,
        policy_number: policyNumber,
        coverage_amount: parseFloat(coverageAmount),
        deductible: deductible ? parseFloat(deductible) : undefined,
        effective_date: effectiveDate,
        expiration_date: expirationDate,
      });
      onAdded();
    } catch {
      // handle
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Add E&O Policy" size="md">
      <div className="space-y-4">
        <Input label="Carrier" value={carrier} onChange={e => setCarrier(e.target.value)} placeholder="e.g. ARIS, Swiss Re" />
        <Input label="Policy Number" value={policyNumber} onChange={e => setPolicyNumber(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Coverage Amount ($)" type="number" value={coverageAmount} onChange={e => setCoverageAmount(e.target.value)} />
          <Input label="Deductible ($)" type="number" value={deductible} onChange={e => setDeductible(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Effective Date" type="date" value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} />
          <Input label="Expiration Date" type="date" value={expirationDate} onChange={e => setExpirationDate(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="shield" onClick={handleSubmit} disabled={saving || !carrier || !policyNumber || !coverageAmount || !effectiveDate || !expirationDate}>
            {saving ? 'Adding...' : 'Add E&O Policy'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
