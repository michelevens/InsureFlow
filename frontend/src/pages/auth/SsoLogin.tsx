import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ssoService } from '@/services/api/sso';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui';

export default function SsoLogin() {
  const { agencySlug } = useParams<{ agencySlug: string }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSsoLogin = async () => {
    if (!agencySlug) return;
    setLoading(true);
    setError(null);
    try {
      const { redirect_url } = await ssoService.login(agencySlug);
      window.location.href = redirect_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'SSO login failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <img src="/logo.png" alt="Insurons" className="h-20 w-auto mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Enterprise SSO Login</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          Sign in with your organization's identity provider
        </p>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-8">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm mb-6">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
            Agency: <span className="font-semibold text-slate-900 dark:text-white">{agencySlug?.toUpperCase()}</span>
          </p>

          <Button
            variant="shield"
            size="lg"
            className="w-full"
            onClick={handleSsoLogin}
            isLoading={loading}
          >
            Continue with SSO
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400 mt-6">
          Not using SSO?{' '}
          <Link to="/login" className="text-shield-600 dark:text-shield-400 font-medium hover:underline">
            Sign in with email
          </Link>
        </p>
      </div>
    </div>
  );
}
