import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, Button, Input } from '@/components/ui';
import { User, Mail, Lock, Bell, Shield, Save, Camera } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile');
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    bio: '',
  });

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: <User className="w-4 h-4" /> },
    { id: 'security' as const, label: 'Security', icon: <Lock className="w-4 h-4" /> },
    { id: 'notifications' as const, label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your account preferences</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <div className="w-48 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-shield-50 text-shield-700'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <Card>
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full gradient-shield flex items-center justify-center text-white text-2xl font-bold">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <Button variant="outline" size="sm" leftIcon={<Camera className="w-4 h-4" />}>Change Photo</Button>
                    <p className="text-xs text-slate-500 mt-1">JPG, PNG. Max 5MB</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    leftIcon={<User className="w-5 h-5" />}
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    leftIcon={<Mail className="w-5 h-5" />}
                  />
                </div>

                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                />

                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <Button variant="shield" leftIcon={<Save className="w-4 h-4" />}>Save Changes</Button>
                  <Button variant="ghost">Cancel</Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card>
              <div className="p-6 space-y-6">
                <h2 className="text-lg font-semibold text-slate-900">Change Password</h2>
                <Input label="Current Password" type="password" placeholder="Enter current password" leftIcon={<Lock className="w-5 h-5" />} />
                <Input label="New Password" type="password" placeholder="Enter new password" leftIcon={<Lock className="w-5 h-5" />} />
                <Input label="Confirm New Password" type="password" placeholder="Confirm new password" leftIcon={<Lock className="w-5 h-5" />} />
                <Button variant="shield" leftIcon={<Save className="w-4 h-4" />}>Update Password</Button>

                <div className="pt-6 border-t border-slate-100">
                  <h2 className="text-lg font-semibold text-slate-900 mb-2">Two-Factor Authentication</h2>
                  <p className="text-sm text-slate-500 mb-4">Add an extra layer of security to your account</p>
                  <Button variant="outline" leftIcon={<Shield className="w-4 h-4" />}>Enable 2FA</Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <div className="p-6 space-y-4">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Notification Preferences</h2>
                {[
                  { label: 'Email notifications', desc: 'Receive updates about your quotes and policies via email' },
                  { label: 'SMS notifications', desc: 'Get text messages for important policy updates' },
                  { label: 'Lead alerts', desc: 'Instant notifications when new leads are assigned' },
                  { label: 'Marketing emails', desc: 'Receive tips and industry news from Insurons' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                    <div>
                      <p className="font-medium text-slate-900">{item.label}</p>
                      <p className="text-sm text-slate-500">{item.desc}</p>
                    </div>
                    <button className="w-11 h-6 rounded-full bg-shield-500 relative transition-colors">
                      <div className="w-5 h-5 rounded-full bg-white absolute right-0.5 top-0.5 shadow-sm" />
                    </button>
                  </div>
                ))}
                <Button variant="shield" leftIcon={<Save className="w-4 h-4" />} className="mt-4">Save Preferences</Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
