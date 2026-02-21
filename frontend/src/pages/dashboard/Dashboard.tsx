import { useAuth } from '@/hooks/useAuth';
import ConsumerDashboard from './ConsumerDashboard';
import AgentDashboard from './AgentDashboard';
import AgencyDashboard from './AgencyDashboard';
import CarrierDashboard from './CarrierDashboard';
import AdminDashboard from './AdminDashboard';

export default function Dashboard() {
  const { user } = useAuth();

  switch (user?.role) {
    case 'consumer':
      return <ConsumerDashboard />;
    case 'agent':
      return <AgentDashboard />;
    case 'agency_owner':
      return <AgencyDashboard />;
    case 'carrier':
      return <CarrierDashboard />;
    case 'admin':
    case 'superadmin':
      return <AdminDashboard />;
    default:
      return <ConsumerDashboard />;
  }
}
