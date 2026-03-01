import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, Button, Input } from '@/components/ui';
import { authService } from '@/services/api';
import { User, Mail, Lock, Bell, Shield, Save, Camera, Palette, Sun, Moon, Monitor, RefreshCw, Check, X, Eye, EyeOff, KeyRound, Copy, ShieldCheck, ShieldOff } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

// Password strength calculation
function calcPasswordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500' };
  if (score <= 2) return { score: 2, label: 'Fair', color: 'bg-orange-500' };
  if (score <= 3) return { score: 3, label: 'Good', color: 'bg-yellow-500' };
  return { score: 4, label: 'Strong', color: 'bg-green-500' };
}

function generateStrongPassword(): string {
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  const symbols = '!@#$%&*?';
  const all = lower + upper + digits + symbols;
  // Guarantee at least one of each
  let pw = [
    lower[Math.floor(Math.random() * lower.length)],
    upper[Math.floor(Math.random() * upper.length)],
    digits[Math.floor(Math.random() * digits.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];
  for (let i = pw.length; i < 16; i++) {
    pw.push(all[Math.floor(Math.random() * all.length)]);
  }
  // Shuffle
  for (let i = pw.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pw[i], pw[j]] = [pw[j], pw[i]];
  }
  return pw.join('');
}

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'appearance'>('profile');
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    bio: '',
  });

  // Password change state
  const [pwForm, setPwForm] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showNewPw, setShowNewPw] = useState(false);

  // MFA state
  const [mfaStep, setMfaStep] = useState<'idle' | 'setup' | 'verify' | 'backup' | 'disable'>('idle');
  const [mfaSetupData, setMfaSetupData] = useState<{ secret: string; qr_uri: string } | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaBackupCodes, setMfaBackupCodes] = useState<string[]>([]);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState('');
  const [disablePassword, setDisablePassword] = useState('');

  const strength = useMemo(() => calcPasswordStrength(pwForm.password), [pwForm.password]);

  const pwChecks = useMemo(() => ({
    length: pwForm.password.length >= 8,
    upper: /[A-Z]/.test(pwForm.password),
    lower: /[a-z]/.test(pwForm.password),
    number: /\d/.test(pwForm.password),
    symbol: /[^a-zA-Z0-9]/.test(pwForm.password),
  }), [pwForm.password]);

  const handleGeneratePassword = useCallback(() => {
    const pw = generateStrongPassword();
    setPwForm(f => ({ ...f, password: pw, password_confirmation: pw }));
    setShowNewPw(true);
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (pwForm.password !== pwForm.password_confirmation) {
      setPwMsg({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    setPwLoading(true);
    try {
      const res = await authService.changePassword(pwForm);
      setPwMsg({ type: 'success', text: res.message || 'Password updated successfully' });
      setPwForm({ current_password: '', password: '', password_confirmation: '' });
    } catch (err) {
      setPwMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update password' });
    } finally {
      setPwLoading(false);
    }
  };

  // MFA handlers
  const handleMfaSetup = async () => {
    setMfaLoading(true);
    setMfaError('');
    try {
      const data = await authService.mfaSetup();
      setMfaSetupData(data);
      setMfaStep('setup');
    } catch (err) {
      setMfaError(err instanceof Error ? err.message : 'Failed to start MFA setup');
    } finally {
      setMfaLoading(false);
    }
  };

  const handleMfaEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaSetupData || !mfaCode) return;
    setMfaLoading(true);
    setMfaError('');
    try {
      const res = await authService.mfaEnable({ secret: mfaSetupData.secret, code: mfaCode });
      setMfaBackupCodes(res.backup_codes);
      setMfaStep('backup');
      setMfaCode('');
      await refreshUser();
    } catch (err) {
      setMfaError(err instanceof Error ? err.message : 'Invalid verification code');
      setMfaCode('');
    } finally {
      setMfaLoading(false);
    }
  };

  const handleMfaDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    setMfaLoading(true);
    setMfaError('');
    try {
      await authService.mfaDisable(disablePassword);
      setMfaStep('idle');
      setDisablePassword('');
      await refreshUser();
    } catch (err) {
      setMfaError(err instanceof Error ? err.message : 'Failed to disable 2FA');
    } finally {
      setMfaLoading(false);
    }
  };

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: <User className="w-4 h-4" /> },
    { id: 'security' as const, label: 'Security', icon: <Lock className="w-4 h-4" /> },
    { id: 'notifications' as const, label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'appearance' as const, label: 'Appearance', icon: <Palette className="w-4 h-4" /> },
  ];

  const isMfaEnabled = !!(user as Record<string, unknown> | null)?.mfa_enabled;

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
            <div className="space-y-6">
              {/* Change Password */}
              <Card>
                <form onSubmit={handleChangePassword} className="p-6 space-y-5">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Change Password</h2>

                  {pwMsg && (
                    <div className={`p-3 rounded-xl text-sm ${pwMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                      {pwMsg.text}
                    </div>
                  )}

                  <Input
                    label="Current Password"
                    type="password"
                    placeholder="Enter current password"
                    value={pwForm.current_password}
                    onChange={e => setPwForm(f => ({ ...f, current_password: e.target.value }))}
                    leftIcon={<Lock className="w-5 h-5" />}
                    required
                  />

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">New Password</label>
                      <button
                        type="button"
                        onClick={handleGeneratePassword}
                        className="flex items-center gap-1 text-xs text-shield-600 hover:text-shield-700 font-medium"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Generate Strong Password
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        type={showNewPw ? 'text' : 'password'}
                        placeholder="Enter new password"
                        value={pwForm.password}
                        onChange={e => setPwForm(f => ({ ...f, password: e.target.value }))}
                        leftIcon={<Lock className="w-5 h-5" />}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw(!showNewPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Strength meter */}
                    {pwForm.password && (
                      <div className="mt-2">
                        <div className="flex gap-1 mb-1.5">
                          {[1, 2, 3, 4].map(i => (
                            <div
                              key={i}
                              className={`h-1.5 flex-1 rounded-full transition-colors ${
                                i <= strength.score ? strength.color : 'bg-slate-200 dark:bg-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                        <p className={`text-xs font-medium ${
                          strength.score <= 1 ? 'text-red-600' :
                          strength.score <= 2 ? 'text-orange-600' :
                          strength.score <= 3 ? 'text-yellow-600' : 'text-green-600'
                        }`}>{strength.label}</p>

                        {/* Checklist */}
                        <div className="mt-2 grid grid-cols-2 gap-1">
                          {[
                            { key: 'length', label: '8+ characters' },
                            { key: 'upper', label: 'Uppercase letter' },
                            { key: 'lower', label: 'Lowercase letter' },
                            { key: 'number', label: 'Number' },
                            { key: 'symbol', label: 'Special character' },
                          ].map(({ key, label }) => (
                            <div key={key} className="flex items-center gap-1.5 text-xs">
                              {pwChecks[key as keyof typeof pwChecks] ? (
                                <Check className="w-3.5 h-3.5 text-green-500" />
                              ) : (
                                <X className="w-3.5 h-3.5 text-slate-300" />
                              )}
                              <span className={pwChecks[key as keyof typeof pwChecks] ? 'text-green-700 dark:text-green-400' : 'text-slate-400'}>{label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <Input
                    label="Confirm New Password"
                    type="password"
                    placeholder="Confirm new password"
                    value={pwForm.password_confirmation}
                    onChange={e => setPwForm(f => ({ ...f, password_confirmation: e.target.value }))}
                    leftIcon={<Lock className="w-5 h-5" />}
                    required
                  />

                  <Button type="submit" variant="shield" leftIcon={<Save className="w-4 h-4" />} isLoading={pwLoading}>
                    Update Password
                  </Button>
                </form>
              </Card>

              {/* Two-Factor Authentication */}
              <Card>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Two-Factor Authentication</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Add an extra layer of security to your account</p>
                    </div>
                    {isMfaEnabled ? (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" /> Enabled
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-50 text-yellow-700 text-xs font-semibold">
                        <ShieldOff className="w-3.5 h-3.5" /> Not Enabled
                      </span>
                    )}
                  </div>

                  {mfaError && (
                    <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm">{mfaError}</div>
                  )}

                  {/* Idle state */}
                  {mfaStep === 'idle' && !isMfaEnabled && (
                    <Button
                      variant="outline"
                      leftIcon={<Shield className="w-4 h-4" />}
                      onClick={handleMfaSetup}
                      isLoading={mfaLoading}
                    >
                      Enable 2FA
                    </Button>
                  )}

                  {mfaStep === 'idle' && isMfaEnabled && (
                    <Button
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      leftIcon={<ShieldOff className="w-4 h-4" />}
                      onClick={() => { setMfaStep('disable'); setMfaError(''); }}
                    >
                      Disable 2FA
                    </Button>
                  )}

                  {/* Setup: show QR code */}
                  {mfaStep === 'setup' && mfaSetupData && (
                    <div className="space-y-4">
                      <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 flex flex-col items-center gap-4">
                        <p className="text-sm text-slate-600 dark:text-slate-300 text-center">
                          Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                        </p>
                        <div className="bg-white p-4 rounded-xl">
                          <QRCodeSVG value={mfaSetupData.qr_uri} size={200} />
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-slate-500 mb-1">Or enter this key manually:</p>
                          <code className="text-sm font-mono bg-white dark:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 select-all">
                            {mfaSetupData.secret}
                          </code>
                        </div>
                      </div>

                      <form onSubmit={handleMfaEnable} className="space-y-3">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                          Enter the 6-digit code from your authenticator app
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          placeholder="000000"
                          value={mfaCode}
                          onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="w-full text-center text-2xl tracking-[0.4em] font-mono py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:border-shield-500 focus:ring-2 focus:ring-shield-500/20 outline-none transition-all"
                          maxLength={6}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button type="submit" variant="shield" isLoading={mfaLoading} disabled={mfaCode.length !== 6}>
                            Verify & Enable
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => { setMfaStep('idle'); setMfaSetupData(null); setMfaCode(''); setMfaError(''); }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Backup codes */}
                  {mfaStep === 'backup' && mfaBackupCodes.length > 0 && (
                    <div className="space-y-4">
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <KeyRound className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-amber-800">Save your backup codes</p>
                            <p className="text-xs text-amber-700 mt-0.5">
                              Store these codes somewhere safe. Each code can only be used once if you lose access to your authenticator app.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                        <div className="grid grid-cols-2 gap-2">
                          {mfaBackupCodes.map((code, i) => (
                            <code key={i} className="text-sm font-mono text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 px-3 py-2 rounded-lg text-center border border-slate-200 dark:border-slate-600">
                              {code}
                            </code>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3 w-full"
                          leftIcon={<Copy className="w-3.5 h-3.5" />}
                          onClick={() => navigator.clipboard.writeText(mfaBackupCodes.join('\n'))}
                        >
                          Copy All Codes
                        </Button>
                      </div>

                      <Button
                        variant="shield"
                        onClick={() => { setMfaStep('idle'); setMfaBackupCodes([]); setMfaSetupData(null); }}
                      >
                        Done
                      </Button>
                    </div>
                  )}

                  {/* Disable confirmation */}
                  {mfaStep === 'disable' && (
                    <form onSubmit={handleMfaDisable} className="space-y-3">
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                        <p className="text-sm text-red-700">
                          This will remove two-factor authentication from your account. Enter your password to confirm.
                        </p>
                      </div>
                      <Input
                        label="Current Password"
                        type="password"
                        placeholder="Enter your password"
                        value={disablePassword}
                        onChange={e => setDisablePassword(e.target.value)}
                        leftIcon={<Lock className="w-5 h-5" />}
                        required
                      />
                      <div className="flex gap-2">
                        <Button type="submit" variant="shield" className="bg-red-600 hover:bg-red-700" isLoading={mfaLoading}>
                          Disable 2FA
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => { setMfaStep('idle'); setDisablePassword(''); setMfaError(''); }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              </Card>
            </div>
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
