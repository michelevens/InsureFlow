import { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { AiChatWidget } from '@/components/ai/AiChatWidget';
import { ComplianceAlertBanner } from '@/components/compliance/ComplianceAlertBanner';
import {
  LayoutDashboard, Calculator, Users, FileText, Briefcase,
  Building2, BarChart3, UserCircle, Settings, LogOut, Menu, X,
  ClipboardList, Target, DollarSign, Star, ShieldCheck, ChevronDown, MessageSquare, Activity, AlertTriangle, RefreshCw, TrendingUp, Key, Plug, Network, CalendarDays, Palette, Code, Award, Database, BookOpen, HelpCircle,
  MessagesSquare, Calendar, Handshake, Mail, FileBarChart, Video, ShoppingCart, Zap, ListChecks,
  Moon, Sun, MessageSquarePlus, Quote, CreditCard,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import type { ReactNode } from 'react';
import type { UserRole } from '@/types';

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  roles: UserRole[];
}

interface NavSection {
  title: string;
  roles: UserRole[];
  items: NavItem[];
}

// Role-based quick links for the top bar (shortcuts to most-used pages)
const quickNavLinks: Record<string, NavItem[]> = {
  consumer: [
    { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" />, roles: ['consumer'] },
    { label: 'Get Quotes', href: '/calculator', icon: <Calculator className="w-4 h-4" />, roles: ['consumer'] },
    { label: 'My Quotes', href: '/portal/quotes', icon: <ClipboardList className="w-4 h-4" />, roles: ['consumer'] },
    { label: 'My Policies', href: '/portal/policies', icon: <ShieldCheck className="w-4 h-4" />, roles: ['consumer'] },
  ],
  agent: [
    { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" />, roles: ['agent'] },
    { label: 'Leads', href: '/crm/leads', icon: <Target className="w-4 h-4" />, roles: ['agent'] },
    { label: 'Applications', href: '/applications', icon: <FileText className="w-4 h-4" />, roles: ['agent'] },
    { label: 'Policies', href: '/policies', icon: <ShieldCheck className="w-4 h-4" />, roles: ['agent'] },
  ],
  agency_owner: [
    { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" />, roles: ['agency_owner'] },
    { label: 'Leads', href: '/crm/leads', icon: <Target className="w-4 h-4" />, roles: ['agency_owner'] },
    { label: 'Applications', href: '/applications', icon: <FileText className="w-4 h-4" />, roles: ['agency_owner'] },
    { label: 'Policies', href: '/policies', icon: <ShieldCheck className="w-4 h-4" />, roles: ['agency_owner'] },
  ],
  carrier: [
    { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" />, roles: ['carrier'] },
    { label: 'Products', href: '/carrier/products', icon: <Briefcase className="w-4 h-4" />, roles: ['carrier'] },
    { label: 'Production', href: '/carrier/production', icon: <BarChart3 className="w-4 h-4" />, roles: ['carrier'] },
  ],
  admin: [
    { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" />, roles: ['admin'] },
    { label: 'Users', href: '/admin/users', icon: <Users className="w-4 h-4" />, roles: ['admin'] },
    { label: 'Agencies', href: '/admin/agencies', icon: <Building2 className="w-4 h-4" />, roles: ['admin'] },
    { label: 'Analytics', href: '/admin/analytics', icon: <BarChart3 className="w-4 h-4" />, roles: ['admin'] },
  ],
  superadmin: [
    { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" />, roles: ['superadmin'] },
    { label: 'Users', href: '/admin/users', icon: <Users className="w-4 h-4" />, roles: ['superadmin'] },
    { label: 'Agencies', href: '/admin/agencies', icon: <Building2 className="w-4 h-4" />, roles: ['superadmin'] },
    { label: 'Analytics', href: '/admin/analytics', icon: <BarChart3 className="w-4 h-4" />, roles: ['superadmin'] },
  ],
};

const navSections: NavSection[] = [
  {
    title: '',
    roles: ['consumer', 'agent', 'agency_owner', 'carrier', 'admin', 'superadmin'],
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, roles: ['consumer', 'agent', 'agency_owner', 'carrier', 'admin', 'superadmin'] },
    ],
  },
  {
    title: 'Insurance',
    roles: ['consumer'],
    items: [
      { label: 'Get Quotes', href: '/calculator', icon: <Calculator className="w-5 h-5" />, roles: ['consumer'] },
      { label: 'My Quotes', href: '/portal/quotes', icon: <ClipboardList className="w-5 h-5" />, roles: ['consumer'] },
      { label: 'My Applications', href: '/portal/applications', icon: <FileText className="w-5 h-5" />, roles: ['consumer'] },
      { label: 'My Policies', href: '/portal/policies', icon: <ShieldCheck className="w-5 h-5" />, roles: ['consumer'] },
      { label: 'Claims', href: '/claims', icon: <AlertTriangle className="w-5 h-5" />, roles: ['consumer'] },
      { label: 'Find Agents', href: '/marketplace', icon: <Users className="w-5 h-5" />, roles: ['consumer'] },
      { label: 'Partners', href: '/partners', icon: <Handshake className="w-5 h-5" />, roles: ['consumer'] },
    ],
  },
  {
    title: 'Pipeline',
    roles: ['agent', 'agency_owner', 'carrier'],
    items: [
      { label: 'Leads', href: '/crm/leads', icon: <Target className="w-5 h-5" />, roles: ['agent', 'agency_owner'] },
      { label: 'Lead Marketplace', href: '/lead-marketplace', icon: <ShoppingCart className="w-5 h-5" />, roles: ['agent', 'agency_owner'] },
      { label: 'Applications', href: '/applications', icon: <FileText className="w-5 h-5" />, roles: ['agent', 'agency_owner', 'carrier'] },
      { label: 'Policies', href: '/policies', icon: <ShieldCheck className="w-5 h-5" />, roles: ['agent', 'agency_owner'] },
      { label: 'Claims', href: '/claims', icon: <AlertTriangle className="w-5 h-5" />, roles: ['agent', 'agency_owner', 'admin', 'superadmin'] },
      { label: 'Renewals', href: '/renewals', icon: <RefreshCw className="w-5 h-5" />, roles: ['agent', 'agency_owner', 'admin', 'superadmin'] },
      { label: 'Tasks', href: '/tasks', icon: <ListChecks className="w-5 h-5" />, roles: ['agent', 'agency_owner', 'admin', 'superadmin'] },
    ],
  },
  {
    title: 'Performance',
    roles: ['agent', 'agency_owner'],
    items: [
      { label: 'Commissions', href: '/commissions', icon: <DollarSign className="w-5 h-5" />, roles: ['agent', 'agency_owner'] },
      { label: 'Reviews', href: '/reviews', icon: <Star className="w-5 h-5" />, roles: ['agent', 'agency_owner'] },
      { label: 'Analytics', href: '/analytics', icon: <TrendingUp className="w-5 h-5" />, roles: ['agent', 'agency_owner'] },
      { label: 'My ROI', href: '/analytics/roi', icon: <BarChart3 className="w-5 h-5" />, roles: ['agent', 'agency_owner'] },
      { label: 'Compliance', href: '/compliance', icon: <Award className="w-5 h-5" />, roles: ['agent', 'agency_owner'] },
      { label: 'Billing', href: '/billing', icon: <CreditCard className="w-5 h-5" />, roles: ['agent', 'agency_owner'] },
    ],
  },
  {
    title: 'Carrier',
    roles: ['carrier'],
    items: [
      { label: 'Products', href: '/carrier/products', icon: <Briefcase className="w-5 h-5" />, roles: ['carrier'] },
      { label: 'Production', href: '/carrier/production', icon: <BarChart3 className="w-5 h-5" />, roles: ['carrier'] },
      { label: 'API Config', href: '/carrier/api-config', icon: <Plug className="w-5 h-5" />, roles: ['carrier', 'admin', 'superadmin'] },
      { label: 'Billing', href: '/billing', icon: <CreditCard className="w-5 h-5" />, roles: ['carrier'] },
    ],
  },
  {
    title: 'Agency',
    roles: ['agency_owner'],
    items: [
      { label: 'Agency Settings', href: '/agency/settings', icon: <Settings className="w-5 h-5" />, roles: ['agency_owner'] },
      { label: 'Organizations', href: '/organizations', icon: <Network className="w-5 h-5" />, roles: ['agency_owner'] },
      { label: 'Recruitment', href: '/recruitment', icon: <Briefcase className="w-5 h-5" />, roles: ['agency_owner'] },
    ],
  },
  {
    title: 'Growth & Marketing',
    roles: ['agent', 'agency_owner', 'admin', 'superadmin'],
    items: [
      { label: 'Campaigns', href: '/campaigns', icon: <Mail className="w-5 h-5" />, roles: ['agent', 'agency_owner', 'admin', 'superadmin'] },
      { label: 'Reports', href: '/reports', icon: <FileBarChart className="w-5 h-5" />, roles: ['agent', 'agency_owner', 'carrier', 'admin', 'superadmin'] },
      { label: 'Market Intel', href: '/data/market-intel', icon: <Database className="w-5 h-5" />, roles: ['agency_owner', 'carrier', 'admin', 'superadmin'] },
    ],
  },
  {
    title: 'Integrations',
    roles: ['agency_owner', 'carrier', 'admin', 'superadmin'],
    items: [
      { label: 'Workflows', href: '/workflows', icon: <Zap className="w-5 h-5" />, roles: ['agent', 'agency_owner', 'admin', 'superadmin'] },
      { label: 'API Keys', href: '/api-keys', icon: <Key className="w-5 h-5" />, roles: ['carrier', 'admin', 'superadmin'] },
      { label: 'Webhooks', href: '/webhooks', icon: <Plug className="w-5 h-5" />, roles: ['carrier', 'admin', 'superadmin'] },
      { label: 'White-Label', href: '/white-label', icon: <Palette className="w-5 h-5" />, roles: ['agency_owner', 'admin', 'superadmin'] },
      { label: 'Embed Widgets', href: '/embed', icon: <Code className="w-5 h-5" />, roles: ['admin', 'superadmin'] },
    ],
  },
  {
    title: 'Platform',
    roles: ['superadmin'],
    items: [
      { label: 'Platform Overview', href: '/admin/platform', icon: <LayoutDashboard className="w-5 h-5" />, roles: ['superadmin'] },
      { label: 'Platform Settings', href: '/admin/platform-settings', icon: <Settings className="w-5 h-5" />, roles: ['superadmin'] },
    ],
  },
  {
    title: 'Admin',
    roles: ['admin', 'superadmin'],
    items: [
      { label: 'Users', href: '/admin/users', icon: <Users className="w-5 h-5" />, roles: ['admin', 'superadmin'] },
      { label: 'Agencies', href: '/admin/agencies', icon: <Building2 className="w-5 h-5" />, roles: ['admin', 'superadmin'] },
      { label: 'Products', href: '/admin/products', icon: <ShieldCheck className="w-5 h-5" />, roles: ['admin', 'superadmin'] },
      { label: 'Carriers', href: '/admin/carriers', icon: <Building2 className="w-5 h-5" />, roles: ['admin', 'superadmin'] },
      { label: 'Profiles', href: '/admin/profiles', icon: <Database className="w-5 h-5" />, roles: ['admin', 'superadmin'] },
      { label: 'Analytics', href: '/admin/analytics', icon: <BarChart3 className="w-5 h-5" />, roles: ['admin', 'superadmin'] },
      { label: 'Plans', href: '/admin/plans', icon: <DollarSign className="w-5 h-5" />, roles: ['admin', 'superadmin'] },
      { label: 'Rate Tables', href: '/admin/rate-tables', icon: <Calculator className="w-5 h-5" />, roles: ['admin', 'superadmin'] },
      { label: 'Testimonials', href: '/admin/testimonials', icon: <Quote className="w-5 h-5" />, roles: ['admin', 'superadmin'] },
      { label: 'Audit Log', href: '/admin/audit-log', icon: <Activity className="w-5 h-5" />, roles: ['admin', 'superadmin'] },
      { label: 'SSO Config', href: '/admin/sso', icon: <Key className="w-5 h-5" />, roles: ['admin', 'superadmin'] },
      { label: 'API Config', href: '/carrier/api-config', icon: <Plug className="w-5 h-5" />, roles: ['admin', 'superadmin'] },
    ],
  },
];

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [learningOpen, setLearningOpen] = useState(false);

  const filteredSections = navSections
    .map(section => ({
      ...section,
      items: section.items.filter(item => user && item.roles.includes(user.role)),
    }))
    .filter(section => section.items.length > 0);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Mobile header */}
      <div className="lg:hidden sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700/50">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <Menu className="w-6 h-6 text-slate-600 dark:text-slate-400" />
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Insurons" className="h-16 w-auto" />
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <Link to="/messages" className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
              <MessageSquare className="w-5 h-5" />
            </Link>
            <NotificationBell />
          </div>
        </div>
        {/* Mobile quick nav strip */}
        {user && quickNavLinks[user.role] && (
          <div className="flex items-center gap-1 px-3 pb-2 overflow-x-auto scrollbar-hide">
            {quickNavLinks[user.role].map(item => {
              const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
                    isActive
                      ? 'bg-shield-50 text-shield-700 dark:bg-shield-900/40 dark:text-shield-300'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="fixed inset-0 bg-black/50" />
        </div>
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700/50 flex flex-col transition-transform duration-300 lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 dark:border-slate-700/50">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="Insurons" className="h-10 w-auto" />
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {filteredSections.map((section, idx) => (
            <div key={section.title || idx} className={idx > 0 ? 'mt-4' : ''}>
              {section.title && (
                <p className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-shield-50 text-shield-700 dark:bg-shield-900/40 dark:text-shield-300'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                      )}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User menu (mobile only — desktop uses top bar) */}
        <div className="border-t border-slate-100 dark:border-slate-700/50 p-3 lg:hidden">
          <Link to="/settings" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800">
            <Settings className="w-5 h-5" /> Settings
          </Link>
          <Link to="/feedback" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800">
            <MessageSquarePlus className="w-5 h-5" /> Share Feedback
          </Link>
          <Link to="/help" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800">
            <HelpCircle className="w-5 h-5" /> Help Center
          </Link>
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20">
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen">
        {/* Desktop top bar */}
        <div className="hidden lg:flex items-center justify-between px-8 py-3 border-b border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 sticky top-0 z-30 transition-colors">
          {/* Quick nav links (left side) */}
          <div className="flex items-center gap-1">
            {user && quickNavLinks[user.role]?.map(item => {
              const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-shield-50 text-shield-700 dark:bg-shield-900/40 dark:text-shield-300'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </div>
          {/* Right side icons */}
          <div className="flex items-center gap-1">
          <Link
            to="/messages"
            className={cn(
              'p-2 rounded-lg transition-colors relative',
              location.pathname === '/messages'
                ? 'bg-shield-50 text-shield-700 dark:bg-shield-900/40 dark:text-shield-300'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
            )}
            title="Messages"
          >
            <MessageSquare className="w-5 h-5" />
          </Link>
          <NotificationBell />
          {user && ['agent', 'agency_owner'].includes(user.role) && (
            <>
              <Link
                to="/calendar"
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  location.pathname === '/calendar'
                    ? 'bg-shield-50 text-shield-700 dark:bg-shield-900/40 dark:text-shield-300'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                )}
                title="Calendar"
              >
                <CalendarDays className="w-5 h-5" />
              </Link>
              <Link
                to="/meetings"
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  location.pathname === '/meetings'
                    ? 'bg-shield-50 text-shield-700 dark:bg-shield-900/40 dark:text-shield-300'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                )}
                title="Meetings"
              >
                <Video className="w-5 h-5" />
              </Link>
            </>
          )}
          {/* Learning & Community dropdown */}
          <div className="relative">
            <button
              onClick={() => setLearningOpen(!learningOpen)}
              className={cn(
                'p-2 rounded-lg transition-colors',
                learningOpen || ['/training', '/forum', '/events', '/partners'].some(p => location.pathname.startsWith(p))
                  ? 'bg-shield-50 text-shield-700 dark:bg-shield-900/40 dark:text-shield-300'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
              )}
              title="Learning & Community"
            >
              <BookOpen className="w-5 h-5" />
            </button>
            {learningOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setLearningOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden z-50">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700/50">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Learning & Community</p>
                  </div>
                  {user && ['agent', 'agency_owner'].includes(user.role) && (
                    <Link to="/training" onClick={() => setLearningOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
                      <BookOpen className="w-4 h-4" /> Training
                    </Link>
                  )}
                  <Link to="/forum" onClick={() => setLearningOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
                    <MessagesSquare className="w-4 h-4" /> Forum
                  </Link>
                  <Link to="/events" onClick={() => setLearningOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
                    <Calendar className="w-4 h-4" /> Events
                  </Link>
                  {user && ['agent', 'agency_owner'].includes(user.role) && (
                    <Link to="/partners" onClick={() => setLearningOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
                      <Handshake className="w-4 h-4" /> Partners
                    </Link>
                  )}
                </div>
              </>
            )}
          </div>
          <Link
            to="/feedback"
            className={cn(
              'p-2 rounded-lg transition-colors',
              location.pathname === '/feedback'
                ? 'bg-shield-50 text-shield-700 dark:bg-shield-900/40 dark:text-shield-300'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
            )}
            title="Share Feedback"
          >
            <MessageSquarePlus className="w-5 h-5" />
          </Link>
          <Link
            to="/help"
            className={cn(
              'p-2 rounded-lg transition-colors',
              location.pathname === '/help'
                ? 'bg-shield-50 text-shield-700 dark:bg-shield-900/40 dark:text-shield-300'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
            )}
            title="Help Center"
          >
            <HelpCircle className="w-5 h-5" />
          </Link>
          <Link
            to="/settings"
            className={cn(
              'p-2 rounded-lg transition-colors',
              location.pathname === '/settings'
                ? 'bg-shield-50 text-shield-700 dark:bg-shield-900/40 dark:text-shield-300'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
            )}
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </Link>
          {/* Dark mode toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2" />
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-full gradient-shield flex items-center justify-center text-white text-sm font-bold">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="text-left hidden xl:block">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-[120px]">{user?.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
              <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform', profileOpen && 'rotate-180')} />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden z-50">
                <Link to="/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
                  <UserCircle className="w-4 h-4" /> Profile
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            )}
          </div>
          </div>
        </div>
        <div className="p-6 lg:p-8">
          <ComplianceAlertBanner />
          <Outlet />
        </div>
      </main>

      {/* AI Chat Widget */}
      <AiChatWidget />
    </div>
  );
}
