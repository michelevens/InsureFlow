import { useState, useEffect } from 'react';
import { Card, Badge, Button, Input, Select, Modal } from '@/components/ui';
import { organizationService } from '@/services/api';
import type { Organization, OrgMember, OrgType, OrgMemberRole } from '@/services/api/organizations';
import {
  Building2, Plus, ChevronRight, ChevronDown, Users, Trash2,
  Globe, Phone, Mail, MapPin, Shield,
} from 'lucide-react';

const orgTypeLabels: Record<OrgType, string> = {
  mga: 'MGA',
  agency: 'Agency',
  sub_agency: 'Sub-Agency',
};

const orgTypeBadge: Record<OrgType, 'shield' | 'info' | 'default'> = {
  mga: 'shield',
  agency: 'info',
  sub_agency: 'default',
};

const roleLabels: Record<OrgMemberRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  manager: 'Manager',
  member: 'Member',
};

export default function OrganizationTree() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);

  const fetchOrgs = async () => {
    setLoading(true);
    try {
      const data = await organizationService.list();
      setOrgs(data);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrgs(); }, []);

  const selectOrg = async (org: Organization) => {
    setSelectedOrg(org);
    setMembersLoading(true);
    try {
      const m = await organizationService.members(org.id);
      setMembers(m);
    } catch {
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  };

  const toggleExpand = (id: number) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpanded(next);
  };

  const deleteOrg = async (id: number) => {
    await organizationService.remove(id);
    if (selectedOrg?.id === id) setSelectedOrg(null);
    fetchOrgs();
  };

  const removeMember = async (memberId: number) => {
    if (!selectedOrg) return;
    await organizationService.removeMember(selectedOrg.id, memberId);
    const m = await organizationService.members(selectedOrg.id);
    setMembers(m);
  };

  // Build tree from flat list
  const rootOrgs = orgs.filter(o => !o.parent_id);

  const renderOrgNode = (org: Organization, depth = 0) => {
    const children = orgs.filter(o => o.parent_id === org.id);
    const isExpanded = expanded.has(org.id);
    const isSelected = selectedOrg?.id === org.id;

    return (
      <div key={org.id} style={{ marginLeft: depth * 24 }}>
        <div
          className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${isSelected ? 'bg-shield-50 border border-shield-200' : 'hover:bg-slate-50'}`}
          onClick={() => selectOrg(org)}
        >
          <div className="flex items-center gap-2">
            {children.length > 0 ? (
              <button onClick={e => { e.stopPropagation(); toggleExpand(org.id); }} className="p-0.5">
                {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
              </button>
            ) : (
              <span className="w-5" />
            )}
            <Building2 className="w-4 h-4 text-shield-600" />
            <span className="font-medium text-slate-900">{org.name}</span>
            <Badge variant={orgTypeBadge[org.type]}>{orgTypeLabels[org.type]}</Badge>
            {!org.is_active && <Badge variant="danger">Inactive</Badge>}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            {org.city && org.state && <span>{org.city}, {org.state}</span>}
            {children.length > 0 && <span>{children.length} sub-orgs</span>}
          </div>
        </div>
        {isExpanded && children.map(child => renderOrgNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Organizations</h1>
          <p className="text-slate-500 mt-1">Manage MGA, agency, and sub-agency hierarchy</p>
        </div>
        <Button variant="shield" onClick={() => setShowCreateOrg(true)}>
          <Plus className="w-4 h-4 mr-1" /> New Organization
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tree */}
        <div className="lg:col-span-1">
          <Card className="p-4">
            <h2 className="text-sm font-bold text-slate-700 mb-3">Hierarchy</h2>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-4 border-shield-200 border-t-shield-600 rounded-full animate-spin" />
              </div>
            ) : rootOrgs.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No organizations yet</p>
            ) : (
              <div className="space-y-1">
                {rootOrgs.map(org => renderOrgNode(org))}
              </div>
            )}
          </Card>
        </div>

        {/* Detail */}
        <div className="lg:col-span-2">
          {selectedOrg ? (
            <div className="space-y-4">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-900">{selectedOrg.name}</h2>
                      <Badge variant={orgTypeBadge[selectedOrg.type]}>{orgTypeLabels[selectedOrg.type]}</Badge>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">Level {selectedOrg.level} &middot; {selectedOrg.slug}</p>
                  </div>
                  <Button variant="danger" size="sm" onClick={() => deleteOrg(selectedOrg.id)}>
                    <Trash2 className="w-4 h-4 mr-1" /> Delete
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  {selectedOrg.email && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="w-4 h-4" /> {selectedOrg.email}
                    </div>
                  )}
                  {selectedOrg.phone && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="w-4 h-4" /> {selectedOrg.phone}
                    </div>
                  )}
                  {selectedOrg.website && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Globe className="w-4 h-4" /> {selectedOrg.website}
                    </div>
                  )}
                  {selectedOrg.address && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin className="w-4 h-4" /> {selectedOrg.address}, {selectedOrg.city} {selectedOrg.state} {selectedOrg.zip}
                    </div>
                  )}
                </div>
              </Card>

              {/* Members */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-shield-600" /> Members
                  </h3>
                  <Button variant="outline" size="sm" onClick={() => setShowAddMember(true)}>
                    <Plus className="w-3 h-3 mr-1" /> Add Member
                  </Button>
                </div>

                {membersLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="w-6 h-6 border-4 border-shield-200 border-t-shield-600 rounded-full animate-spin" />
                  </div>
                ) : members.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">No members</p>
                ) : (
                  <div className="space-y-2">
                    {members.map(m => (
                      <div key={m.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-shield-100 text-shield-700 flex items-center justify-center text-sm font-bold">
                            {m.user?.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 text-sm">{m.user?.name}</p>
                            <p className="text-xs text-slate-500">{m.user?.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={m.role === 'owner' ? 'shield' : 'default'}>{roleLabels[m.role]}</Badge>
                          {m.role !== 'owner' && (
                            <Button variant="ghost" size="sm" onClick={() => removeMember(m.id)}>
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Select an organization to view details</p>
            </Card>
          )}
        </div>
      </div>

      {/* Create Org Modal */}
      {showCreateOrg && (
        <CreateOrgModal
          parentOrgs={orgs}
          onClose={() => setShowCreateOrg(false)}
          onCreated={fetchOrgs}
        />
      )}

      {/* Add Member Modal */}
      {showAddMember && selectedOrg && (
        <AddMemberModal
          orgId={selectedOrg.id}
          onClose={() => setShowAddMember(false)}
          onAdded={async () => {
            const m = await organizationService.members(selectedOrg.id);
            setMembers(m);
          }}
        />
      )}
    </div>
  );
}

function CreateOrgModal({ parentOrgs, onClose, onCreated }: {
  parentOrgs: Organization[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState<OrgType>('agency');
  const [parentId, setParentId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name) return;
    setSaving(true);
    try {
      await organizationService.create({
        name,
        type,
        parent_id: parentId ? Number(parentId) : null,
        email: email || undefined,
        phone: phone || undefined,
      });
      onCreated();
      onClose();
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="New Organization">
      <div className="space-y-4">
        <Input label="Name" placeholder="Organization name" value={name} onChange={e => setName(e.target.value)} />
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Type"
            options={[{ value: 'mga', label: 'MGA' }, { value: 'agency', label: 'Agency' }, { value: 'sub_agency', label: 'Sub-Agency' }]}
            value={type}
            onChange={e => setType(e.target.value as OrgType)}
          />
          <Select
            label="Parent Organization"
            options={[{ value: '', label: 'None (Root)' }, ...parentOrgs.map(o => ({ value: String(o.id), label: o.name }))]}
            value={parentId}
            onChange={e => setParentId(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          <Input label="Phone" value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="shield" onClick={handleSubmit} disabled={saving || !name}>
            {saving ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function AddMemberModal({ orgId, onClose, onAdded }: {
  orgId: number;
  onClose: () => void;
  onAdded: () => Promise<void>;
}) {
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<OrgMemberRole>('member');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      await organizationService.addMember(orgId, { user_id: Number(userId), role });
      await onAdded();
      onClose();
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Add Member">
      <div className="space-y-4">
        <Input label="User ID" type="number" placeholder="Enter user ID" value={userId} onChange={e => setUserId(e.target.value)} />
        <Select
          label="Role"
          options={[
            { value: 'member', label: 'Member' },
            { value: 'manager', label: 'Manager' },
            { value: 'admin', label: 'Admin' },
            { value: 'owner', label: 'Owner' },
          ]}
          value={role}
          onChange={e => setRole(e.target.value as OrgMemberRole)}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="shield" onClick={handleSubmit} disabled={saving || !userId}>
            {saving ? 'Adding...' : 'Add Member'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
