import { useState, useEffect, useCallback } from 'react';
import { Card, Badge, Button, Input, Select, Modal, Textarea } from '@/components/ui';
import { crmService, scenarioService, ratingService, marketplaceService } from '@/services/api';
import type { Lead } from '@/types';
import type {
  LeadScenario, Coverage,
  CreateScenarioPayload, ScenarioStatus, ObjectType, ProductTypeMap,
  SuggestedCoverageInfo,
} from '@/services/api/leadScenarios';
import type {
  RatingResult, RatingOptions, RatingRunAudit, RateScenarioPayload,
} from '@/services/api/rating';
import {
  Search, Phone, Mail, Plus, ChevronRight, ChevronDown,
  User, Car, Home, Building2, HelpCircle, Shield, Trash2, FileText, ArrowRight,
  Layers, Target, ClipboardList, Calculator, DollarSign, History, CheckCircle2,
  XCircle, TrendingUp, ToggleLeft, ToggleRight, RefreshCw, ShoppingCart,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Status configs ─────────────────────────────────

const leadStatusConfig: Record<string, { label: string; variant: 'default' | 'shield' | 'success' | 'warning' | 'danger' | 'info' }> = {
  new: { label: 'New', variant: 'shield' },
  contacted: { label: 'Contacted', variant: 'info' },
  quoted: { label: 'Quoted', variant: 'warning' },
  applied: { label: 'Applied', variant: 'info' },
  won: { label: 'Won', variant: 'success' },
  lost: { label: 'Lost', variant: 'danger' },
};

const scenarioStatusConfig: Record<ScenarioStatus, { label: string; variant: 'default' | 'shield' | 'success' | 'warning' | 'danger' | 'info' }> = {
  draft: { label: 'Draft', variant: 'default' },
  quoting: { label: 'Quoting', variant: 'shield' },
  quoted: { label: 'Quoted', variant: 'warning' },
  comparing: { label: 'Comparing', variant: 'info' },
  selected: { label: 'Selected', variant: 'info' },
  applied: { label: 'Applied', variant: 'info' },
  bound: { label: 'Bound', variant: 'success' },
  declined: { label: 'Declined', variant: 'danger' },
  expired: { label: 'Expired', variant: 'danger' },
};

const objectTypeIcons: Record<ObjectType, typeof User> = {
  person: User,
  vehicle: Car,
  property: Home,
  business: Building2,
  other: HelpCircle,
};

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'applied', label: 'Applied' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

// ── Helpers ─────────────────────────────────────

function formatCurrency(val: number | null | undefined): string {
  if (val == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
}

function formatDate(val: string | null | undefined): string {
  if (!val) return '—';
  return new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function coverageLabel(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ── Main component ─────────────────────────────────

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [counts, setCounts] = useState({ total: 0, new: 0, contacted: 0, quoted: 0, applied: 0, won: 0, lost: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Detail / scenario state
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [scenarios, setScenarios] = useState<LeadScenario[]>([]);
  const [expandedScenario, setExpandedScenario] = useState<number | null>(null);
  const [scenariosLoading, setScenariosLoading] = useState(false);

  // Modals
  const [showAddLead, setShowAddLead] = useState(false);
  const [showNewScenario, setShowNewScenario] = useState(false);
  const [showAddObject, setShowAddObject] = useState<number | null>(null);
  const [showAddCoverage, setShowAddCoverage] = useState<number | null>(null);
  const [showConvert, setShowConvert] = useState<number | null>(null);
  const [showRating, setShowRating] = useState<number | null>(null);
  const [showSellLead, setShowSellLead] = useState(false);

  // Reference data
  const [productTypes, setProductTypes] = useState<ProductTypeMap>({});

  // ── Load leads ─────────────────────────────────

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await crmService.getLeads({ status: statusFilter || undefined, search: search || undefined });
      setLeads(res.items);
      setCounts(res.counts);
    } catch {
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  useEffect(() => {
    scenarioService.productTypes().then(setProductTypes).catch(() => { toast.error('Failed to load product types'); });
  }, []);

  // ── Open lead detail ─────────────────────────

  const openLead = async (lead: Lead) => {
    setSelectedLead(lead);
    setScenariosLoading(true);
    try {
      const data = await scenarioService.list(lead.id);
      setScenarios(data);
    } catch {
      setScenarios([]);
    } finally {
      setScenariosLoading(false);
    }
  };

  const closeLead = () => {
    setSelectedLead(null);
    setScenarios([]);
    setExpandedScenario(null);
  };

  const refreshScenarios = async () => {
    if (!selectedLead) return;
    const data = await scenarioService.list(selectedLead.id);
    setScenarios(data);
  };

  const deleteScenario = async (scenarioId: number) => {
    if (!selectedLead) return;
    await scenarioService.remove(selectedLead.id, scenarioId);
    await refreshScenarios();
  };

  const deleteObject = async (scenarioId: number, objectId: number) => {
    if (!selectedLead) return;
    await scenarioService.removeObject(selectedLead.id, scenarioId, objectId);
    await refreshScenarios();
  };

  const deleteCoverage = async (scenarioId: number, coverageId: number) => {
    if (!selectedLead) return;
    await scenarioService.removeCoverage(selectedLead.id, scenarioId, coverageId);
    await refreshScenarios();
  };

  // ── Flatten product types for selects ─────────

  const productOptions = Object.entries(productTypes).flatMap(([category, types]) =>
    Object.entries(types).map(([value, label]) => ({ value, label: `${label} (${category})` }))
  );

  // ── Lead Detail View ─────────────────────────

  if (selectedLead) {
    const statusCfg = leadStatusConfig[selectedLead.status] || leadStatusConfig.new;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={closeLead}>
            <ChevronRight className="w-4 h-4 rotate-180" /> Back
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-shield-100 text-shield-700 flex items-center justify-center text-lg font-bold">
                {selectedLead.first_name[0]}{selectedLead.last_name[0]}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{selectedLead.first_name} {selectedLead.last_name}</h1>
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <span>{selectedLead.email}</span>
                  <span>{selectedLead.phone}</span>
                  <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                </div>
              </div>
            </div>
          </div>
          {selectedLead.source !== 'marketplace' && (
            <Button variant="ghost" size="sm" onClick={() => setShowSellLead(true)}>
              <ShoppingCart className="w-4 h-4 mr-1" /> Sell on Marketplace
            </Button>
          )}
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-xs text-slate-500 mb-1">Insurance Type</p>
            <p className="font-medium text-slate-900 capitalize">{selectedLead.insurance_type}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-slate-500 mb-1">Source</p>
            <p className="font-medium text-slate-900 capitalize">{selectedLead.source}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-slate-500 mb-1">Scenarios</p>
            <p className="font-medium text-slate-900">{scenarios.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-slate-500 mb-1">Created</p>
            <p className="font-medium text-slate-900">{formatDate(selectedLead.created_at)}</p>
          </Card>
        </div>

        {/* Scenarios header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-shield-600" /> Scenarios
          </h2>
          <Button variant="shield" size="sm" onClick={() => setShowNewScenario(true)}>
            <Plus className="w-4 h-4 mr-1" /> New Scenario
          </Button>
        </div>

        {/* Scenario list */}
        {scenariosLoading ? (
          <Card className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-shield-200 border-t-shield-600 rounded-full animate-spin mx-auto" />
          </Card>
        ) : scenarios.length === 0 ? (
          <Card className="p-8 text-center">
            <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 mb-4">No scenarios yet. Create one to start building coverage options.</p>
            <Button variant="shield" onClick={() => setShowNewScenario(true)}>
              <Plus className="w-4 h-4 mr-1" /> Create First Scenario
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {scenarios.map(scenario => {
              const isExpanded = expandedScenario === scenario.id;
              const sCfg = scenarioStatusConfig[scenario.status] || scenarioStatusConfig.draft;
              const productLabel = productOptions.find(p => p.value === scenario.product_type)?.label || scenario.product_type;

              return (
                <Card key={scenario.id} className="overflow-hidden">
                  {/* Header */}
                  <button
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
                    onClick={() => setExpandedScenario(isExpanded ? null : scenario.id)}
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{scenario.scenario_name}</span>
                          <Badge variant={sCfg.variant}>{sCfg.label}</Badge>
                          <span className="text-xs text-slate-400">P{scenario.priority}</span>
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5">{productLabel}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      {scenario.target_premium_monthly != null && (
                        <span>Target: {formatCurrency(scenario.target_premium_monthly)}/mo</span>
                      )}
                      {scenario.best_quoted_premium != null && (
                        <span className="text-savings-600 font-medium">Best: {formatCurrency(scenario.best_quoted_premium)}/mo</span>
                      )}
                      <span>{scenario.insured_objects.length} objects</span>
                      <span>{scenario.coverages.length} coverages</span>
                    </div>
                  </button>

                  {/* Expanded */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 p-4 space-y-6">
                      {/* Details grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        {scenario.effective_date_desired && (
                          <div><span className="text-slate-500">Effective Date:</span> <span className="font-medium">{formatDate(scenario.effective_date_desired)}</span></div>
                        )}
                        {scenario.current_carrier && (
                          <div><span className="text-slate-500">Current Carrier:</span> <span className="font-medium">{scenario.current_carrier}</span></div>
                        )}
                        {scenario.current_premium_monthly != null && (
                          <div><span className="text-slate-500">Current Premium:</span> <span className="font-medium">{formatCurrency(scenario.current_premium_monthly)}/mo</span></div>
                        )}
                        {scenario.current_policy_expiration && (
                          <div><span className="text-slate-500">Expiration:</span> <span className="font-medium">{formatDate(scenario.current_policy_expiration)}</span></div>
                        )}
                      </div>

                      {/* Insured Objects */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                            <User className="w-4 h-4" /> Insured Objects
                          </h3>
                          <Button variant="outline" size="sm" onClick={() => setShowAddObject(scenario.id)}>
                            <Plus className="w-3 h-3 mr-1" /> Add
                          </Button>
                        </div>
                        {scenario.insured_objects.length === 0 ? (
                          <p className="text-sm text-slate-400 italic">No insured objects added yet</p>
                        ) : (
                          <div className="space-y-2">
                            {scenario.insured_objects.map(obj => {
                              const Icon = objectTypeIcons[obj.object_type] || HelpCircle;
                              return (
                                <div key={obj.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                                  <div className="flex items-center gap-3">
                                    <Icon className="w-4 h-4 text-shield-600" />
                                    <div>
                                      <span className="font-medium text-slate-900 text-sm">{obj.name}</span>
                                      {obj.relationship && <span className="text-xs text-slate-500 ml-2">({obj.relationship})</span>}
                                      <div className="text-xs text-slate-400 mt-0.5">
                                        {obj.object_type === 'person' && obj.date_of_birth && `DOB: ${formatDate(obj.date_of_birth)}`}
                                        {obj.object_type === 'vehicle' && obj.vehicle_year && `${obj.vehicle_year} ${obj.vehicle_make} ${obj.vehicle_model}`}
                                        {obj.object_type === 'property' && obj.address_line1 && `${obj.address_line1}, ${obj.city} ${obj.state}`}
                                        {obj.object_type === 'business' && obj.naics_code && `NAICS: ${obj.naics_code}`}
                                      </div>
                                    </div>
                                  </div>
                                  <Button variant="ghost" size="sm" onClick={() => deleteObject(scenario.id, obj.id)}>
                                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Coverages */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                            <Shield className="w-4 h-4" /> Coverages
                          </h3>
                          <Button variant="outline" size="sm" onClick={() => setShowAddCoverage(scenario.id)}>
                            <Plus className="w-3 h-3 mr-1" /> Add
                          </Button>
                        </div>
                        {scenario.coverages.length === 0 ? (
                          <p className="text-sm text-slate-400 italic">No coverages configured yet</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                                  <th className="pb-2 pr-4">Coverage</th>
                                  <th className="pb-2 pr-4">Category</th>
                                  <th className="pb-2 pr-4 text-right">Limit</th>
                                  <th className="pb-2 pr-4 text-right">Deductible</th>
                                  <th className="pb-2 pr-4 text-right">Benefit</th>
                                  <th className="pb-2 text-center">Included</th>
                                  <th className="pb-2"></th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {scenario.coverages.map(cov => (
                                  <tr key={cov.id}>
                                    <td className="py-2 pr-4 font-medium text-slate-900">{coverageLabel(cov.coverage_type)}</td>
                                    <td className="py-2 pr-4"><Badge variant="default">{cov.coverage_category}</Badge></td>
                                    <td className="py-2 pr-4 text-right">{formatCurrency(cov.limit_amount)}</td>
                                    <td className="py-2 pr-4 text-right">{formatCurrency(cov.deductible_amount)}</td>
                                    <td className="py-2 pr-4 text-right">{formatCurrency(cov.benefit_amount)}</td>
                                    <td className="py-2 text-center">
                                      {cov.is_included ? <span className="text-savings-600">Yes</span> : <span className="text-slate-400">No</span>}
                                    </td>
                                    <td className="py-2 text-right">
                                      <Button variant="ghost" size="sm" onClick={() => deleteCoverage(scenario.id, cov.id)}>
                                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      {/* Notes */}
                      {scenario.notes && (
                        <div>
                          <h3 className="text-sm font-bold text-slate-700 mb-1">Notes</h3>
                          <p className="text-sm text-slate-600 whitespace-pre-wrap">{scenario.notes}</p>
                        </div>
                      )}

                      {/* Applications */}
                      {scenario.applications && scenario.applications.length > 0 && (
                        <div>
                          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                            <ClipboardList className="w-4 h-4" /> Applications ({scenario.applications.length})
                          </h3>
                          <div className="space-y-2">
                            {scenario.applications.map(app => (
                              <div key={app.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 text-sm">
                                <div>
                                  <span className="font-medium">{app.reference}</span>
                                  <span className="text-slate-500 ml-2">{app.carrier_name}</span>
                                </div>
                                <Badge variant="info">{app.status}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        <Button variant="shield" size="sm" onClick={() => setShowRating(scenario.id)}>
                          <Calculator className="w-4 h-4 mr-1" /> Rate Scenario
                        </Button>
                        <Button variant="shield" size="sm" onClick={() => setShowConvert(scenario.id)}>
                          <ArrowRight className="w-4 h-4 mr-1" /> Convert to Application
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => deleteScenario(scenario.id)}>
                          <Trash2 className="w-4 h-4 mr-1" /> Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* ── Modals ───────────────────────────────── */}

        {showNewScenario && (
          <NewScenarioModal
            leadId={selectedLead.id}
            productOptions={productOptions}
            onClose={() => setShowNewScenario(false)}
            onCreated={refreshScenarios}
          />
        )}

        {showAddObject !== null && (
          <AddObjectModal
            leadId={selectedLead.id}
            scenarioId={showAddObject}
            onClose={() => setShowAddObject(null)}
            onCreated={refreshScenarios}
          />
        )}

        {showAddCoverage !== null && (
          <AddCoverageModal
            leadId={selectedLead.id}
            scenarioId={showAddCoverage}
            scenario={scenarios.find(s => s.id === showAddCoverage)}
            onClose={() => setShowAddCoverage(null)}
            onCreated={refreshScenarios}
          />
        )}

        {showConvert !== null && (
          <ConvertModal
            leadId={selectedLead.id}
            scenarioId={showConvert}
            onClose={() => setShowConvert(null)}
            onConverted={() => { refreshScenarios(); fetchLeads(); }}
          />
        )}

        {showRating !== null && (
          <RatingPanel
            scenario={scenarios.find(s => s.id === showRating)!}
            onClose={() => setShowRating(null)}
            onRated={refreshScenarios}
          />
        )}

        {showSellLead && selectedLead && (
          <SellLeadModal
            lead={selectedLead}
            onClose={() => setShowSellLead(false)}
            onListed={() => { setShowSellLead(false); toast.success('Lead listed on marketplace!'); }}
          />
        )}
      </div>
    );
  }

  // ── Lead List View ─────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lead Pipeline</h1>
          <p className="text-slate-500 mt-1">Manage leads, scenarios, and applications</p>
        </div>
        <Button variant="shield" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowAddLead(true)}>
          Add Lead
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{counts.total}</p>
          <p className="text-sm text-slate-500">Total Leads</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-shield-600">{counts.new}</p>
          <p className="text-sm text-slate-500">New</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-confidence-600">{counts.contacted + counts.quoted + counts.applied}</p>
          <p className="text-sm text-slate-500">In Progress</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-savings-600">{counts.won}</p>
          <p className="text-sm text-slate-500">Won</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)} leftIcon={<Search className="w-5 h-5" />} />
        </div>
        <div className="w-48">
          <Select options={statusOptions} value={statusFilter} onChange={e => setStatusFilter(e.target.value)} />
        </div>
      </div>

      {/* Lead list */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-shield-200 border-t-shield-600 rounded-full animate-spin" />
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No leads found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Lead</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Insurance</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Status</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Source</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Date</th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {leads.map(lead => {
                  const config = leadStatusConfig[lead.status] || leadStatusConfig.new;
                  return (
                    <tr key={lead.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => openLead(lead)}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-shield-100 text-shield-700 flex items-center justify-center text-sm font-bold">
                            {lead.first_name[0]}{lead.last_name[0]}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{lead.first_name} {lead.last_name}</p>
                            <p className="text-xs text-slate-500">{lead.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-700 capitalize">{lead.insurance_type}</td>
                      <td className="p-4"><Badge variant={config.variant}>{config.label}</Badge></td>
                      <td className="p-4 text-sm text-slate-500 capitalize">{lead.source}</td>
                      <td className="p-4 text-sm text-slate-500">{formatDate(lead.created_at)}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); window.location.href = `tel:${lead.phone}`; }}><Phone className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); window.location.href = `mailto:${lead.email}`; }}><Mail className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); openLead(lead); }}><ChevronRight className="w-4 h-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showAddLead && (
        <AddLeadModal
          onClose={() => setShowAddLead(false)}
          onCreated={fetchLeads}
        />
      )}
    </div>
  );
}

// ── Add Lead Modal ─────────────────────────────────

const INSURANCE_TYPES = [
  { value: '', label: 'Select type...' },
  { value: 'auto', label: 'Auto' },
  { value: 'homeowners', label: 'Homeowners' },
  { value: 'life_term', label: 'Term Life' },
  { value: 'life_whole', label: 'Whole Life' },
  { value: 'health_individual', label: 'Health (Individual)' },
  { value: 'health_group', label: 'Health (Group)' },
  { value: 'long_term_care', label: 'Long Term Care' },
  { value: 'disability_ltd', label: 'Disability (LTD)' },
  { value: 'disability_std', label: 'Disability (STD)' },
  { value: 'medicare_supplement', label: 'Medicare Supplement' },
  { value: 'commercial_gl', label: 'Commercial GL' },
  { value: 'workers_comp', label: 'Workers Comp' },
  { value: 'umbrella', label: 'Umbrella' },
  { value: 'renters', label: 'Renters' },
  { value: 'flood', label: 'Flood' },
];

const LEAD_SOURCES = [
  { value: '', label: 'Select source...' },
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'phone', label: 'Phone' },
  { value: 'walk-in', label: 'Walk-in' },
  { value: 'partner', label: 'Partner' },
  { value: 'other', label: 'Other' },
];

function AddLeadModal({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    insurance_type: '',
    source: '',
    estimated_value: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.first_name || !form.last_name || !form.email || !form.insurance_type) return;
    setSaving(true);
    try {
      await crmService.createLead({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone || undefined,
        insurance_type: form.insurance_type,
        source: form.source || undefined,
        estimated_value: form.estimated_value ? Number(form.estimated_value) : undefined,
        notes: form.notes || undefined,
      });
      toast.success('Lead created successfully');
      await onCreated();
      onClose();
    } catch {
      toast.error('Failed to create lead');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Add New Lead">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name *"
            placeholder="John"
            value={form.first_name}
            onChange={e => setForm({ ...form, first_name: e.target.value })}
          />
          <Input
            label="Last Name *"
            placeholder="Doe"
            value={form.last_name}
            onChange={e => setForm({ ...form, last_name: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Email *"
            type="email"
            placeholder="john@example.com"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Phone"
            placeholder="(555) 123-4567"
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Insurance Type *"
            options={INSURANCE_TYPES}
            value={form.insurance_type}
            onChange={e => setForm({ ...form, insurance_type: e.target.value })}
          />
          <Select
            label="Source"
            options={LEAD_SOURCES}
            value={form.source}
            onChange={e => setForm({ ...form, source: e.target.value })}
          />
        </div>
        <Input
          label="Estimated Value ($)"
          type="number"
          placeholder="0.00"
          value={form.estimated_value}
          onChange={e => setForm({ ...form, estimated_value: e.target.value })}
        />
        <Textarea
          label="Notes"
          placeholder="Any notes about this lead..."
          value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })}
          rows={3}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            variant="shield"
            onClick={handleSubmit}
            disabled={saving || !form.first_name || !form.last_name || !form.email || !form.insurance_type}
          >
            {saving ? 'Creating...' : 'Create Lead'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── New Scenario Modal ─────────────────────────────

function NewScenarioModal({ leadId, productOptions, onClose, onCreated }: {
  leadId: number;
  productOptions: { value: string; label: string }[];
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const [form, setForm] = useState<CreateScenarioPayload>({
    scenario_name: '',
    product_type: '',
    priority: 1,
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.scenario_name || !form.product_type) return;
    setSaving(true);
    try {
      await scenarioService.create(leadId, form);
      await onCreated();
      onClose();
    } catch {
      toast.error('Failed to create scenario');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="New Scenario">
      <div className="space-y-4">
        <Input
          label="Scenario Name"
          placeholder="e.g. Primary Auto Coverage"
          value={form.scenario_name}
          onChange={e => setForm({ ...form, scenario_name: e.target.value })}
        />
        <Select
          label="Product Type"
          options={[{ value: '', label: 'Select product type...' }, ...productOptions]}
          value={form.product_type}
          onChange={e => setForm({ ...form, product_type: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Priority"
            options={[1, 2, 3, 4, 5].map(n => ({ value: String(n), label: `P${n}` }))}
            value={String(form.priority)}
            onChange={e => setForm({ ...form, priority: Number(e.target.value) })}
          />
          <Input
            label="Target Premium ($/mo)"
            type="number"
            placeholder="0.00"
            value={form.target_premium_monthly?.toString() || ''}
            onChange={e => setForm({ ...form, target_premium_monthly: e.target.value ? Number(e.target.value) : undefined })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Effective Date"
            type="date"
            value={form.effective_date_desired || ''}
            onChange={e => setForm({ ...form, effective_date_desired: e.target.value || null })}
          />
          <Input
            label="Current Carrier"
            placeholder="e.g. State Farm"
            value={form.current_carrier || ''}
            onChange={e => setForm({ ...form, current_carrier: e.target.value || null })}
          />
        </div>
        <Textarea
          label="Notes"
          placeholder="Any additional notes..."
          value={form.notes || ''}
          onChange={e => setForm({ ...form, notes: e.target.value || null })}
          rows={3}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="shield" onClick={handleSubmit} disabled={saving || !form.scenario_name || !form.product_type}>
            {saving ? 'Creating...' : 'Create Scenario'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Add Insured Object Modal ─────────────────────────

function AddObjectModal({ leadId, scenarioId, onClose, onCreated }: {
  leadId: number;
  scenarioId: number;
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const [objectType, setObjectType] = useState<ObjectType>('person');
  const [name, setName] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { object_type: objectType, name };
      Object.entries(fields).forEach(([key, val]) => {
        if (!val) return;
        if (['vehicle_year', 'year_built', 'square_footage', 'employee_count', 'height_inches', 'weight_lbs'].includes(key)) {
          payload[key] = Number(val);
        } else if (['annual_revenue', 'annual_income'].includes(key)) {
          payload[key] = Number(val);
        } else if (key === 'tobacco_use') {
          payload[key] = val === 'true';
        } else {
          payload[key] = val;
        }
      });
      await scenarioService.addObject(leadId, scenarioId, payload as never);
      await onCreated();
      onClose();
    } catch {
      toast.error('Failed to add insured object');
    } finally {
      setSaving(false);
    }
  };

  const objectTypeOptions = [
    { value: 'person', label: 'Person' },
    { value: 'vehicle', label: 'Vehicle' },
    { value: 'property', label: 'Property' },
    { value: 'business', label: 'Business' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <Modal isOpen onClose={onClose} title="Add Insured Object">
      <div className="space-y-4">
        <Select
          label="Object Type"
          options={objectTypeOptions}
          value={objectType}
          onChange={e => { setObjectType(e.target.value as ObjectType); setFields({}); }}
        />
        <Input
          label="Name"
          placeholder={objectType === 'person' ? 'John Doe' : objectType === 'vehicle' ? '2024 Honda Civic' : 'Name'}
          value={name}
          onChange={e => setName(e.target.value)}
        />

        {objectType === 'person' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Relationship" placeholder="e.g. Primary, Spouse" value={fields.relationship || ''} onChange={e => setFields({ ...fields, relationship: e.target.value })} />
              <Input label="Date of Birth" type="date" value={fields.date_of_birth || ''} onChange={e => setFields({ ...fields, date_of_birth: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Select label="Gender" options={[{ value: '', label: 'Select...' }, { value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }]} value={fields.gender || ''} onChange={e => setFields({ ...fields, gender: e.target.value })} />
              <Input label="Height (in)" type="number" value={fields.height_inches || ''} onChange={e => setFields({ ...fields, height_inches: e.target.value })} />
              <Input label="Weight (lbs)" type="number" value={fields.weight_lbs || ''} onChange={e => setFields({ ...fields, weight_lbs: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select label="Tobacco Use" options={[{ value: '', label: 'Select...' }, { value: 'false', label: 'No' }, { value: 'true', label: 'Yes' }]} value={fields.tobacco_use || ''} onChange={e => setFields({ ...fields, tobacco_use: e.target.value })} />
              <Input label="Occupation" value={fields.occupation || ''} onChange={e => setFields({ ...fields, occupation: e.target.value })} />
            </div>
            <Input label="Annual Income" type="number" placeholder="0.00" value={fields.annual_income || ''} onChange={e => setFields({ ...fields, annual_income: e.target.value })} />
          </>
        )}

        {objectType === 'vehicle' && (
          <>
            <div className="grid grid-cols-3 gap-4">
              <Input label="Year" type="number" value={fields.vehicle_year || ''} onChange={e => setFields({ ...fields, vehicle_year: e.target.value })} />
              <Input label="Make" placeholder="Honda" value={fields.vehicle_make || ''} onChange={e => setFields({ ...fields, vehicle_make: e.target.value })} />
              <Input label="Model" placeholder="Civic" value={fields.vehicle_model || ''} onChange={e => setFields({ ...fields, vehicle_model: e.target.value })} />
            </div>
            <Input label="VIN" placeholder="17-character VIN" value={fields.vin || ''} onChange={e => setFields({ ...fields, vin: e.target.value })} />
          </>
        )}

        {objectType === 'property' && (
          <>
            <Input label="Address" placeholder="123 Main St" value={fields.address_line1 || ''} onChange={e => setFields({ ...fields, address_line1: e.target.value })} />
            <div className="grid grid-cols-3 gap-4">
              <Input label="City" value={fields.city || ''} onChange={e => setFields({ ...fields, city: e.target.value })} />
              <Input label="State" placeholder="TX" value={fields.state || ''} onChange={e => setFields({ ...fields, state: e.target.value })} />
              <Input label="ZIP" value={fields.zip || ''} onChange={e => setFields({ ...fields, zip: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input label="Year Built" type="number" value={fields.year_built || ''} onChange={e => setFields({ ...fields, year_built: e.target.value })} />
              <Input label="Sq Footage" type="number" value={fields.square_footage || ''} onChange={e => setFields({ ...fields, square_footage: e.target.value })} />
              <Input label="Construction" placeholder="Frame, Brick, etc." value={fields.construction_type || ''} onChange={e => setFields({ ...fields, construction_type: e.target.value })} />
            </div>
          </>
        )}

        {objectType === 'business' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Input label="FEIN" value={fields.fein || ''} onChange={e => setFields({ ...fields, fein: e.target.value })} />
              <Input label="NAICS Code" value={fields.naics_code || ''} onChange={e => setFields({ ...fields, naics_code: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Annual Revenue" type="number" placeholder="0.00" value={fields.annual_revenue || ''} onChange={e => setFields({ ...fields, annual_revenue: e.target.value })} />
              <Input label="Employee Count" type="number" value={fields.employee_count || ''} onChange={e => setFields({ ...fields, employee_count: e.target.value })} />
            </div>
          </>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="shield" onClick={handleSubmit} disabled={saving || !name}>
            {saving ? 'Adding...' : 'Add Object'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Add Coverage Modal ─────────────────────────────

function AddCoverageModal({ leadId, scenarioId, scenario, onClose, onCreated }: {
  leadId: number;
  scenarioId: number;
  scenario?: LeadScenario;
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const [coverageType, setCoverageType] = useState('');
  const [coverageCategory, setCoverageCategory] = useState('liability');
  const [limitAmount, setLimitAmount] = useState('');
  const [deductible, setDeductible] = useState('');
  const [benefitAmount, setBenefitAmount] = useState('');
  const [benefitPeriod, setBenefitPeriod] = useState('');
  const [eliminationDays, setEliminationDays] = useState('');
  const [isIncluded, setIsIncluded] = useState(true);
  const [saving, setSaving] = useState(false);

  const [suggested, setSuggested] = useState<SuggestedCoverageInfo | null>(null);
  useEffect(() => {
    if (scenario?.product_type) {
      scenarioService.suggestedCoverages(scenario.product_type).then(setSuggested).catch(() => { /* non-critical */ });
    }
  }, [scenario?.product_type]);

  const categoryOptions = [
    { value: 'liability', label: 'Liability' },
    { value: 'property', label: 'Property' },
    { value: 'medical', label: 'Medical' },
    { value: 'life', label: 'Life' },
    { value: 'disability', label: 'Disability' },
    { value: 'specialty', label: 'Specialty' },
  ];

  const handleSubmit = async () => {
    if (!coverageType || !coverageCategory) return;
    setSaving(true);
    try {
      await scenarioService.addCoverage(leadId, scenarioId, {
        coverage_type: coverageType,
        coverage_category: coverageCategory as Coverage['coverage_category'],
        limit_amount: limitAmount ? Number(limitAmount) : null,
        deductible_amount: deductible ? Number(deductible) : null,
        benefit_amount: benefitAmount ? Number(benefitAmount) : null,
        benefit_period: benefitPeriod || null,
        elimination_period_days: eliminationDays ? Number(eliminationDays) : null,
        is_included: isIncluded,
      } as never);
      await onCreated();
      onClose();
    } catch {
      toast.error('Failed to add coverage');
    } finally {
      setSaving(false);
    }
  };

  const quickAddTypes = suggested?.coverage_types
    ? Object.entries(suggested.coverage_types).flatMap(([cat, types]) =>
        types.map(t => ({ type: t, category: cat }))
      )
    : [];

  return (
    <Modal isOpen onClose={onClose} title="Add Coverage">
      <div className="space-y-4">
        {quickAddTypes.length > 0 && (
          <div>
            <p className="text-xs text-slate-500 mb-2">Quick select:</p>
            <div className="flex flex-wrap gap-1.5">
              {quickAddTypes.slice(0, 12).map(({ type, category }) => (
                <button
                  key={type}
                  className="text-xs px-2 py-1 rounded-full bg-shield-50 text-shield-700 hover:bg-shield-100 transition-colors"
                  onClick={() => { setCoverageType(type); setCoverageCategory(category); }}
                >
                  {coverageLabel(type)}
                </button>
              ))}
            </div>
          </div>
        )}

        <Input
          label="Coverage Type"
          placeholder="e.g. bodily_injury_per_person"
          value={coverageType}
          onChange={e => setCoverageType(e.target.value)}
        />
        <Select
          label="Category"
          options={categoryOptions}
          value={coverageCategory}
          onChange={e => setCoverageCategory(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Limit ($)" type="number" placeholder="0.00" value={limitAmount} onChange={e => setLimitAmount(e.target.value)} />
          <Input label="Deductible ($)" type="number" placeholder="0.00" value={deductible} onChange={e => setDeductible(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Benefit Amount ($)" type="number" placeholder="0.00" value={benefitAmount} onChange={e => setBenefitAmount(e.target.value)} />
          <Input label="Benefit Period" placeholder="e.g. 20 years, to age 65" value={benefitPeriod} onChange={e => setBenefitPeriod(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Elimination Period (days)" type="number" value={eliminationDays} onChange={e => setEliminationDays(e.target.value)} />
          <Select
            label="Included"
            options={[{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No (Optional)' }]}
            value={String(isIncluded)}
            onChange={e => setIsIncluded(e.target.value === 'true')}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="shield" onClick={handleSubmit} disabled={saving || !coverageType}>
            {saving ? 'Adding...' : 'Add Coverage'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Convert to Application Modal ─────────────────────

function ConvertModal({ leadId, scenarioId, onClose, onConverted }: {
  leadId: number;
  scenarioId: number;
  onClose: () => void;
  onConverted: () => void;
}) {
  const [carrierName, setCarrierName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!carrierName) return;
    setSaving(true);
    try {
      await scenarioService.convert(leadId, scenarioId, { carrier_name: carrierName });
      onConverted();
      onClose();
    } catch {
      toast.error('Failed to convert to application');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Convert to Application">
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          This will create a new application from this scenario, copying all insured objects and coverages.
        </p>
        <Input
          label="Carrier Name"
          placeholder="e.g. State Farm, Progressive, Mutual of Omaha"
          value={carrierName}
          onChange={e => setCarrierName(e.target.value)}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="shield" onClick={handleSubmit} disabled={saving || !carrierName}>
            <FileText className="w-4 h-4 mr-1" />
            {saving ? 'Converting...' : 'Create Application'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Rating Panel ─────────────────────────────────────

function RatingPanel({ scenario, onClose, onRated }: {
  scenario: LeadScenario;
  onClose: () => void;
  onRated: () => Promise<void>;
}) {
  const [tab, setTab] = useState<'rate' | 'results' | 'history'>('rate');
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [options, setOptions] = useState<RatingOptions | null>(null);
  const [result, setResult] = useState<RatingResult | null>(null);
  const [history, setHistory] = useState<RatingRunAudit[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // User selections
  const [paymentMode, setPaymentMode] = useState<'monthly' | 'quarterly' | 'semiannual' | 'annual'>('monthly');
  const [factorSelections, setFactorSelections] = useState<Record<string, string>>({});
  const [riderSelections, setRiderSelections] = useState<Record<string, boolean>>({});

  // Load options on mount
  useEffect(() => {
    setOptionsLoading(true);
    ratingService.getOptions(scenario.product_type)
      .then(opts => {
        setOptions(opts);
        // Pre-select default riders
        const defaults: Record<string, boolean> = {};
        opts.riders.forEach(r => { defaults[r.code] = r.default; });
        setRiderSelections(defaults);
      })
      .catch(() => toast.error('Failed to load rating options'))
      .finally(() => setOptionsLoading(false));
  }, [scenario.product_type]);

  const handleRate = async () => {
    setLoading(true);
    try {
      const payload: RateScenarioPayload = {
        payment_mode: paymentMode,
        factor_selections: factorSelections,
        rider_selections: riderSelections,
      };
      const res = await ratingService.rateScenario(scenario.id, payload);
      setResult(res);
      setTab('results');
      await onRated();
      if (res.eligible) {
        toast.success(`Premium: ${fmtCurrency(res.premium_modal)}/${paymentMode}`);
      } else {
        toast.warning(`Ineligible: ${res.ineligible_reason}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Rating failed');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await ratingService.getHistory(scenario.id);
      setHistory(data);
    } catch {
      toast.error('Failed to load rating history');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => { if (tab === 'history') loadHistory(); }, [tab]);

  const fmtCurrency = (val: number | null | undefined) => {
    if (val == null) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const factorGroups = options ? Object.entries(options.factors) : [];

  return (
    <Modal isOpen onClose={onClose} title={`Rate: ${scenario.scenario_name}`} size="lg">
      <div>
        {/* Tabs */}
        <div className="flex border-b border-slate-200 mb-4">
          {[
            { key: 'rate' as const, label: 'Configure', icon: Calculator },
            { key: 'results' as const, label: 'Results', icon: DollarSign },
            { key: 'history' as const, label: 'History', icon: History },
          ].map(t => (
            <button
              key={t.key}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-shield-600 text-shield-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setTab(t.key)}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Configure tab */}
        {tab === 'rate' && (
          <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
            {optionsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-shield-200 border-t-shield-600 rounded-full animate-spin" />
              </div>
            ) : !options ? (
              <div className="text-center py-8 text-slate-500">
                <XCircle className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p>No rate table available for <strong>{scenario.product_type}</strong></p>
              </div>
            ) : (
              <>
                {/* Product info */}
                <div className="bg-shield-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-shield-800">
                    Product: <span className="capitalize">{scenario.product_type.replace(/_/g, ' ')}</span>
                  </p>
                  <p className="text-xs text-shield-600 mt-0.5">
                    Rate Table v{options.rate_table_version} &bull; {scenario.insured_objects.length} insured objects &bull; {scenario.coverages.length} coverages
                  </p>
                </div>

                {/* Payment Mode */}
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">Payment Mode</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['monthly', 'quarterly', 'semiannual', 'annual'] as const).map(mode => (
                      <button
                        key={mode}
                        className={`text-sm py-2 rounded-lg font-medium transition-colors ${
                          paymentMode === mode
                            ? 'bg-shield-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                        onClick={() => setPaymentMode(mode)}
                      >
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Factors */}
                {factorGroups.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4" /> Rating Factors
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {factorGroups.map(([code, group]) => (
                        <div key={code}>
                          <label className="text-xs font-medium text-slate-600 block mb-1">
                            {group.label || code.replace(/_/g, ' ')}
                          </label>
                          <select
                            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-shield-500 focus:border-shield-500"
                            value={factorSelections[code] || ''}
                            onChange={e => setFactorSelections({ ...factorSelections, [code]: e.target.value })}
                          >
                            <option value="">— Not selected —</option>
                            {group.options.map(o => (
                              <option key={o.value} value={o.value}>
                                {o.value.replace(/_/g, ' ')} ({o.mode === 'multiply' ? `×${o.factor}` : `+${o.factor}`})
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Riders */}
                {options.riders.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5">
                      <Shield className="w-4 h-4" /> Riders & Endorsements
                    </h3>
                    <div className="space-y-2">
                      {options.riders.map(rider => {
                        const isOn = riderSelections[rider.code] ?? rider.default;
                        return (
                          <button
                            key={rider.code}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
                              isOn ? 'bg-shield-50 border border-shield-200' : 'bg-slate-50 border border-slate-100'
                            }`}
                            onClick={() => setRiderSelections({ ...riderSelections, [rider.code]: !isOn })}
                          >
                            <div className="flex items-center gap-2">
                              {isOn
                                ? <ToggleRight className="w-5 h-5 text-shield-600" />
                                : <ToggleLeft className="w-5 h-5 text-slate-400" />
                              }
                              <span className={isOn ? 'text-shield-800 font-medium' : 'text-slate-600'}>{rider.label}</span>
                            </div>
                            <span className="text-xs text-slate-500">
                              {rider.mode === 'add' ? fmtCurrency(rider.value) : `×${rider.value}`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Rate Button */}
                <div className="pt-2">
                  <Button variant="shield" className="w-full" onClick={handleRate} disabled={loading}>
                    {loading ? (
                      <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Calculating...</>
                    ) : (
                      <><Calculator className="w-4 h-4 mr-2" /> Calculate Premium</>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Results tab */}
        {tab === 'results' && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {!result ? (
              <div className="text-center py-8 text-slate-500">
                <Calculator className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p>Run a rating first to see results</p>
              </div>
            ) : !result.eligible ? (
              <div className="text-center py-8">
                <XCircle className="w-12 h-12 mx-auto mb-3 text-red-400" />
                <p className="text-lg font-semibold text-red-600">Ineligible</p>
                <p className="text-sm text-slate-500 mt-1">{result.ineligible_reason}</p>
              </div>
            ) : (
              <>
                {/* Premium hero */}
                <div className="bg-gradient-to-br from-shield-600 to-shield-800 rounded-xl p-6 text-white text-center">
                  <p className="text-sm opacity-80 mb-1">
                    {paymentMode.charAt(0).toUpperCase() + paymentMode.slice(1)} Premium
                  </p>
                  <p className="text-4xl font-bold">{fmtCurrency(result.premium_modal)}</p>
                  <p className="text-sm opacity-80 mt-2">
                    Annual: {fmtCurrency(result.premium_annual)}
                  </p>
                </div>

                {/* DI-specific info */}
                {result.monthly_benefit_approved != null && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-amber-800">
                      Monthly Benefit Approved: {fmtCurrency(result.monthly_benefit_approved)}
                    </p>
                    {result.income_replacement_ratio != null && (
                      <p className="text-xs text-amber-600 mt-0.5">
                        Income Replacement: {(result.income_replacement_ratio * 100).toFixed(0)}%
                        {result.occupation_class && ` | Occ Class: ${result.occupation_class}`}
                      </p>
                    )}
                  </div>
                )}

                {/* Premium breakdown */}
                <div>
                  <h4 className="text-sm font-bold text-slate-700 mb-2">Premium Breakdown</h4>
                  <div className="bg-slate-50 rounded-lg divide-y divide-slate-100">
                    <div className="flex justify-between px-4 py-2.5 text-sm">
                      <span className="text-slate-600">Exposure</span>
                      <span className="font-medium">{result.exposure.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between px-4 py-2.5 text-sm">
                      <span className="text-slate-600">Base Rate ({result.base_rate_key})</span>
                      <span className="font-medium">{result.base_rate_value.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between px-4 py-2.5 text-sm">
                      <span className="text-slate-600">Base Premium</span>
                      <span className="font-medium">{fmtCurrency(result.base_premium)}</span>
                    </div>

                    {/* Factors */}
                    {result.factors_applied.length > 0 && (
                      <>
                        {result.factors_applied.map((f, i) => (
                          <div key={i} className="flex justify-between px-4 py-2 text-sm">
                            <span className="text-slate-500 pl-4">
                              {f.label}: {f.option} ({f.mode === 'multiply' ? `×${f.value}` : `+${f.value}`})
                            </span>
                          </div>
                        ))}
                        <div className="flex justify-between px-4 py-2.5 text-sm">
                          <span className="text-slate-600">After Factors</span>
                          <span className="font-medium">{fmtCurrency(result.premium_factored)}</span>
                        </div>
                      </>
                    )}

                    {/* Riders */}
                    {result.riders_applied.length > 0 && (
                      <>
                        {result.riders_applied.map((r, i) => (
                          <div key={i} className="flex justify-between px-4 py-2 text-sm">
                            <span className="text-slate-500 pl-4">{r.label}</span>
                            <span className="text-slate-600">{r.charge >= 0 ? '+' : ''}{fmtCurrency(r.charge)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between px-4 py-2.5 text-sm">
                          <span className="text-slate-600">After Riders</span>
                          <span className="font-medium">{fmtCurrency(result.premium_with_riders)}</span>
                        </div>
                      </>
                    )}

                    {/* Fees */}
                    {result.fees_applied.length > 0 && (
                      <>
                        {result.fees_applied.map((f, i) => (
                          <div key={i} className="flex justify-between px-4 py-2 text-sm">
                            <span className={`pl-4 ${f.type === 'credit' ? 'text-savings-600' : 'text-slate-500'}`}>
                              {f.label} ({f.type})
                            </span>
                            <span className={f.type === 'credit' ? 'text-savings-600' : 'text-slate-600'}>
                              {f.amount >= 0 ? '+' : ''}{fmtCurrency(f.amount)}
                            </span>
                          </div>
                        ))}
                      </>
                    )}

                    <div className="flex justify-between px-4 py-3 text-sm font-bold bg-shield-50">
                      <span className="text-shield-800">Annual Premium</span>
                      <span className="text-shield-800">{fmtCurrency(result.premium_annual)}</span>
                    </div>
                    <div className="flex justify-between px-4 py-2.5 text-sm">
                      <span className="text-slate-600">
                        Modal: {result.modal_mode} (×{result.modal_factor}{result.modal_fee > 0 ? ` +${fmtCurrency(result.modal_fee)}` : ''})
                      </span>
                      <span className="font-bold text-shield-700">{fmtCurrency(result.premium_modal)}</span>
                    </div>
                  </div>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span>Engine v{result.engine_version}</span>
                  <span>Table v{result.rate_table_version}</span>
                </div>

                {/* Re-rate button */}
                <Button variant="outline" className="w-full" onClick={() => setTab('rate')}>
                  <RefreshCw className="w-4 h-4 mr-2" /> Adjust & Re-Rate
                </Button>
              </>
            )}
          </div>
        )}

        {/* History tab */}
        {tab === 'history' && (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {historyLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-shield-200 border-t-shield-600 rounded-full animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <History className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p>No rating history yet</p>
              </div>
            ) : (
              history.map(run => (
                <Card key={run.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {run.status === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-savings-600" />
                      ) : run.status === 'ineligible' ? (
                        <XCircle className="w-4 h-4 text-amber-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <Badge variant={run.status === 'success' ? 'success' : run.status === 'ineligible' ? 'warning' : 'danger'}>
                        {run.status}
                      </Badge>
                      <span className="text-xs text-slate-400">{run.duration_ms}ms</span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(run.created_at).toLocaleString()}
                    </span>
                  </div>
                  {run.output_snapshot?.eligible && (
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-bold text-shield-700">
                        {fmtCurrency(run.output_snapshot.premium_modal)}/{run.output_snapshot.modal_mode}
                      </span>
                      <span className="text-slate-500">
                        Annual: {fmtCurrency(run.output_snapshot.premium_annual)}
                      </span>
                    </div>
                  )}
                  {run.error_message && (
                    <p className="text-sm text-red-600 mt-1">{run.error_message}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                    <span>v{run.engine_version}</span>
                    <span>Table v{run.rate_table_version}</span>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

// ── Sell Lead Modal ─────────────────────────────────

function SellLeadModal({ lead, onClose, onListed }: { lead: Lead; onClose: () => void; onListed: () => void }) {
  const [askingPrice, setAskingPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [expiresIn, setExpiresIn] = useState('30');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const price = parseFloat(askingPrice);
    if (!price || price < 1) {
      toast.error('Enter a valid asking price ($1 minimum)');
      return;
    }
    setSubmitting(true);
    try {
      await marketplaceService.createListing({
        lead_id: lead.id,
        asking_price: price,
        seller_notes: notes || undefined,
        expires_in_days: parseInt(expiresIn) || 30,
      });
      onListed();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to list lead';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen title="Sell Lead on Marketplace" onClose={onClose}>
      <div className="space-y-4">
        <Card className="p-4 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-shield-100 text-shield-700 flex items-center justify-center font-bold">
              {lead.first_name[0]}{lead.last_name[0]}
            </div>
            <div>
              <p className="font-medium text-slate-900">{lead.first_name} {lead.last_name}</p>
              <p className="text-sm text-slate-500 capitalize">{lead.insurance_type} &middot; {lead.email}</p>
            </div>
          </div>
        </Card>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Asking Price ($)</label>
          <Input
            type="number"
            min="1"
            max="9999"
            step="0.01"
            placeholder="e.g. 25.00"
            value={askingPrice}
            onChange={e => setAskingPrice(e.target.value)}
            leftIcon={<DollarSign className="w-4 h-4" />}
          />
          <p className="text-xs text-slate-400 mt-1">Platform takes a small fee; you receive the remainder.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Seller Notes (optional)</label>
          <Textarea
            placeholder="Any details that help buyers (e.g. 'Hot lead, called 2x, ready to quote')"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Listing Duration</label>
          <select
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            value={expiresIn}
            onChange={e => setExpiresIn(e.target.value)}
          >
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
            <option value="60">60 days</option>
            <option value="90">90 days</option>
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button variant="shield" className="flex-1" onClick={handleSubmit} disabled={submitting}>
            <ShoppingCart className="w-4 h-4 mr-1" />
            {submitting ? 'Listing...' : 'List on Marketplace'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
