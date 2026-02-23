import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  skipOnboardingCheck?: boolean;
}

export function ProtectedRoute({ skipOnboardingCheck }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-shield-200 border-t-shield-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to onboarding if not completed (only for agent/agency_owner roles)
  if (
    !skipOnboardingCheck &&
    user &&
    !user.onboarding_completed &&
    ['agent', 'agency_owner'].includes(user.role) &&
    location.pathname !== '/onboarding'
  ) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
