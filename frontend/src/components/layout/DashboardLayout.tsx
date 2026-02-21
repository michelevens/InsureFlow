import { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import {
  Shield, LayoutDashboard, Calculator, Users, FileText, Briefcase,
  Building2, BarChart3, UserCircle, Settings, LogOut, Menu, X,
  ClipboardList, Target, DollarSign, Star, ShieldCheck, ChevronDown, MessageSquare,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { UserRole } from '@/types';

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, roles: ['consumer', 'agent', 'agency_owner', 'carrier', 'admin', 'superadmin'] },
  { label: 'Get Quotes', href: '/calculator', icon: <Calculator className="w-5 h-5" />, roles: ['consumer'] },
  { label: 'My Quotes', href: '/portal/quotes', icon: <ClipboardList className="w-5 h-5" />, roles: ['consumer'] },
  { label: 'My Applications', href: '/portal/applications', icon: <FileText className="w-5 h-5" />, roles: ['consumer'] },
  { label: 'My Policies', href: '/portal/policies', icon: <ShieldCheck className="w-5 h-5" />, roles: ['consumer'] },
  { label: 'Leads', href: '/crm/leads', icon: <Target className="w-5 h-5" />, roles: ['agent', 'agency_owner'] },
  { label: 'Applications', href: '/applications', icon: <FileText className="w-5 h-5" />, roles: ['agent', 'agency_owner', 'carrier'] },
  { label: 'Policies', href: '/policies', icon: <ShieldCheck className="w-5 h-5" />, roles: ['agent', 'agency_owner'] },
  { label: 'Commissions', href: '/commissions', icon: <DollarSign className="w-5 h-5" />, roles: ['agent', 'agency_owner'] },
  { label: 'Reviews', href: '/reviews', icon: <Star className="w-5 h-5" />, roles: ['agent', 'agency_owner'] },
  { label: 'My Team', href: '/agency/team', icon: <Users className="w-5 h-5" />, roles: ['agency_owner'] },
  { label: 'Products', href: '/carrier/products', icon: <Briefcase className="w-5 h-5" />, roles: ['carrier'] },
  { label: 'Production', href: '/carrier/production', icon: <BarChart3 className="w-5 h-5" />, roles: ['carrier'] },
  { label: 'Messages', href: '/messages', icon: <MessageSquare className="w-5 h-5" />, roles: ['consumer', 'agent', 'agency_owner', 'carrier', 'admin', 'superadmin'] },
  { label: 'Find Agents', href: '/marketplace', icon: <Users className="w-5 h-5" />, roles: ['consumer'] },
  { label: 'Users', href: '/admin/users', icon: <Users className="w-5 h-5" />, roles: ['admin', 'superadmin'] },
  { label: 'Agencies', href: '/admin/agencies', icon: <Building2 className="w-5 h-5" />, roles: ['admin', 'superadmin'] },
  { label: 'Analytics', href: '/admin/analytics', icon: <BarChart3 className="w-5 h-5" />, roles: ['admin', 'superadmin'] },
  { label: 'Plans', href: '/admin/plans', icon: <DollarSign className="w-5 h-5" />, roles: ['admin', 'superadmin'] },
  { label: 'Settings', href: '/settings', icon: <Settings className="w-5 h-5" />, roles: ['consumer', 'agent', 'agency_owner', 'carrier', 'admin', 'superadmin'] },
];

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const filteredNav = navItems.filter(item => user && item.roles.includes(user.role));

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
        <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-slate-100">
          <Menu className="w-6 h-6 text-slate-600" />
        </button>
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-shield-600" />
          <span className="font-bold text-slate-900">Insurons</span>
        </div>
        <div className="w-10" />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="fixed inset-0 bg-black/50" />
        </div>
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gradient-shield flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">Insurons</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {filteredNav.map((item) => {
            const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-shield-50 text-shield-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User menu */}
        <div className="border-t border-slate-100 p-3">
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full gradient-shield flex items-center justify-center text-white text-sm font-bold">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-slate-900 truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
              <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform', profileOpen && 'rotate-180')} />
            </button>

            {profileOpen && (
              <div className="absolute bottom-full left-0 w-full mb-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                <Link to="/settings" className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50">
                  <UserCircle className="w-4 h-4" /> Profile
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen">
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
