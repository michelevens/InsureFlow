import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, Button, Input } from '@/components/ui';
import { User, Mail, Lock, Bell, Shield, Save, Camera, Palette, Sun, Moon, Monitor } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'appearance'>('profile');
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
    { id: 'appearance' as const, label: 'Appearance', icon: <Palette className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your account preferences</p>
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
                  ? 'bg-shield-50 text-shield-700 dark:bg-shield-900/40 dark:text-shield-300'
                  : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
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
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">JPG, PNG. Max 5MB</p>
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

                <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                  <Button variant="shield" leftIcon={<Save className="w-4 h-4" />}>Save Changes</Button>
                  <Button variant="ghost">Cancel</Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card>
              <div className="p-6 space-y-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Change Password</h2>
                <Input label="Current Password" type="password" placeholder="Enter current password" leftIcon={<Lock className="w-5 h-5" />} />
                <Input label="New Password" type="password" placeholder="Enter new password" leftIcon={<Lock className="w-5 h-5" />} />
                <Input label="Confirm New Password" type="password" placeholder="Confirm new password" leftIcon={<Lock className="w-5 h-5" />} />
                <Button variant="shield" leftIcon={<Save className="w-4 h-4" />}>Update Password</Button>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-700/50">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Two-Factor Authentication</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Add an extra layer of security to your account</p>
                  <Button variant="outline" leftIcon={<Shield className="w-4 h-4" />}>Enable 2FA</Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <div className="p-6 space-y-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Notification Preferences</h2>
                {[
                  { label: 'Email notifications', desc: 'Receive updates about your quotes and policies via email' },
                  { label: 'SMS notifications', desc: 'Get text messages for important policy updates' },
                  { label: 'Lead alerts', desc: 'Instant notifications when new leads are assigned' },
                  { label: 'Marketing emails', desc: 'Receive tips and industry news from Insurons' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50 dark:border-slate-800 last:border-0">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{item.label}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
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

          {activeTab === 'appearance' && (
            <Card>
              <div className="p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Theme</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Choose how Insurons looks for you</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'light' as const, label: 'Light', icon: <Sun className="w-5 h-5" />, desc: 'Clean and bright interface' },
                    { id: 'dark' as const, label: 'Dark', icon: <Moon className="w-5 h-5" />, desc: 'Easy on the eyes' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setTheme(opt.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        theme === opt.id
                          ? 'border-shield-500 bg-shield-50 dark:bg-shield-900/30 ring-1 ring-shield-500/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                        theme === opt.id
                          ? 'bg-shield-100 text-shield-600 dark:bg-shield-800/50 dark:text-shield-400'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {opt.icon}
                      </div>
                      <p className={`font-semibold text-sm ${
                        theme === opt.id
                          ? 'text-shield-700 dark:text-shield-300'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}>{opt.label}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>

                {/* Preview strip */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className={`p-4 text-center text-sm font-medium ${
                    theme === 'dark'
                      ? 'bg-slate-900 text-white border-b border-slate-700'
                      : 'bg-white text-slate-900 border-b border-slate-200'
                  }`}>
                    <Monitor className="w-4 h-4 inline-block mr-2" />
                    Preview: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'} is active
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
