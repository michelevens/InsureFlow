import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PWAPrompt } from '@/components/pwa/PWAPrompt';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 5 * 60 * 1000 } },
});

// Loading fallback
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-shield-200 border-t-shield-600 rounded-full animate-spin" />
    </div>
  );
}

// Lazy-loaded pages
// Auth
const Login = lazy(() => import('@/pages/auth/Login'));
const Register = lazy(() => import('@/pages/auth/Register'));
const VerifyEmail = lazy(() => import('@/pages/auth/VerifyEmail'));
const AcceptInvite = lazy(() => import('@/pages/auth/AcceptInvite'));
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword'));
const SsoLogin = lazy(() => import('@/pages/auth/SsoLogin'));
const SsoCallback = lazy(() => import('@/pages/auth/SsoCallback'));

// Onboarding
const Onboarding = lazy(() => import('@/pages/onboarding/Onboarding'));

// Public
const Landing = lazy(() => import('@/pages/public/Landing'));
const Pricing = lazy(() => import('@/pages/public/Pricing'));
const Privacy = lazy(() => import('@/pages/public/Privacy'));
const Terms = lazy(() => import('@/pages/public/Terms'));

// Calculator (public)
const Calculator = lazy(() => import('@/pages/calculator/Calculator'));
const QuoteResults = lazy(() => import('@/pages/calculator/QuoteResults'));

// Marketplace (public)
const Marketplace = lazy(() => import('@/pages/marketplace/Marketplace'));
const AgentProfile = lazy(() => import('@/pages/marketplace/AgentProfile'));
const InsuranceRequestForm = lazy(() => import('@/pages/marketplace/InsuranceRequestForm'));
const ScenarioPublicView = lazy(() => import('@/pages/marketplace/ScenarioPublicView'));
const ApplicationSigningPage = lazy(() => import('@/pages/marketplace/ApplicationSigningPage'));

// Agent Marketplace (protected)
const AgentMarketplace = lazy(() => import('@/pages/marketplace/AgentMarketplace'));

// Dashboard
const Dashboard = lazy(() => import('@/pages/dashboard/Dashboard'));

// Consumer Portal
const MyQuotes = lazy(() => import('@/pages/portal/MyQuotes'));
const MyApplications = lazy(() => import('@/pages/portal/MyApplications'));
const MyPolicies = lazy(() => import('@/pages/portal/MyPolicies'));

// Messaging & Notifications
const Messages = lazy(() => import('@/pages/messages/Messages'));
const Notifications = lazy(() => import('@/pages/notifications/Notifications'));

// Documents & E-Signature
const DocumentsPage = lazy(() => import('@/pages/documents/Documents'));

// Agent / Agency
const Leads = lazy(() => import('@/pages/crm/Leads'));
const Applications = lazy(() => import('@/pages/applications/Applications'));
const Policies = lazy(() => import('@/pages/policies/Policies'));
const Commissions = lazy(() => import('@/pages/analytics/Commissions'));
const Reviews = lazy(() => import('@/pages/analytics/Reviews'));
const AgencyTeam = lazy(() => import('@/pages/admin/AgencyTeam'));

// Claims
const ClaimsPage = lazy(() => import('@/pages/claims/Claims'));

// Renewals
const RenewalsPage = lazy(() => import('@/pages/renewals/Renewals'));

// Carrier
const Products = lazy(() => import('@/pages/carriers/Products'));
const Production = lazy(() => import('@/pages/carriers/Production'));
const CarrierApiConfigPage = lazy(() => import('@/pages/carriers/CarrierApiConfig'));

// Analytics
const AdvancedAnalytics = lazy(() => import('@/pages/analytics/AdvancedAnalytics'));

// Admin
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'));
const AdminAgencies = lazy(() => import('@/pages/admin/AdminAgencies'));
const AdminAnalytics = lazy(() => import('@/pages/admin/AdminAnalytics'));
const AdminPlans = lazy(() => import('@/pages/admin/AdminPlans'));
const AdminProducts = lazy(() => import('@/pages/admin/AdminProducts'));
const AdminCarriers = lazy(() => import('@/pages/admin/AdminCarriers'));
const AdminProfiles = lazy(() => import('@/pages/admin/AdminProfiles'));
const AdminAuditLog = lazy(() => import('@/pages/admin/AdminAuditLog'));
const SuperAdminDashboard = lazy(() => import('@/pages/admin/SuperAdminDashboard'));
const SuperAdminSettings = lazy(() => import('@/pages/admin/SuperAdminSettings'));
const SsoConfig = lazy(() => import('@/pages/admin/SsoConfig'));

// Agency
const AgencyProducts = lazy(() => import('@/pages/agency/AgencyProducts'));
const AgencyAppointments = lazy(() => import('@/pages/agency/AgencyAppointments'));
const AgencySettings = lazy(() => import('@/pages/agency/AgencySettings'));

// Organizations
const OrganizationTree = lazy(() => import('@/pages/organizations/OrganizationTree'));

// Webhooks
const WebhookSettings = lazy(() => import('@/pages/webhooks/WebhookSettings'));

// Calendar
const CalendarPage = lazy(() => import('@/pages/calendar/Calendar'));

// White-Label
const WhiteLabelConfigPage = lazy(() => import('@/pages/whitelabel/WhiteLabelConfig'));

// Embed Partners
const EmbedPartnerDashboard = lazy(() => import('@/pages/embed/EmbedPartnerDashboard'));

// Compliance
const ComplianceDashboard = lazy(() => import('@/pages/compliance/ComplianceDashboard'));

// Data Products & API Keys
const MarketIntelDashboard = lazy(() => import('@/pages/data/MarketIntelDashboard'));
const ApiKeyManagement = lazy(() => import('@/pages/apikeys/ApiKeyManagement'));

// Recruitment & Training
const RecruitmentDashboard = lazy(() => import('@/pages/recruitment/RecruitmentDashboard'));
const TrainingCatalog = lazy(() => import('@/pages/training/TrainingCatalog'));

// Help Center
const HelpCenterPage = lazy(() => import('@/pages/help/HelpCenter'));

// Phase 6: Ecosystem
const ForumHome = lazy(() => import('@/pages/forum/ForumHome'));
const EventCalendar = lazy(() => import('@/pages/events/EventCalendar'));
const PartnerDirectory = lazy(() => import('@/pages/partners/PartnerDirectory'));
const CampaignBuilder = lazy(() => import('@/pages/campaigns/CampaignBuilder'));
const ReportBuilder = lazy(() => import('@/pages/reports/ReportBuilder'));
const LtcComparisonReport = lazy(() => import('@/pages/reports/LtcComparisonReport'));

// Video Meetings
const MeetingsPage = lazy(() => import('@/pages/meetings/Meetings'));
const MeetingRoom = lazy(() => import('@/pages/meetings/MeetingRoom'));

// Lead Intake (public)
const LeadIntake = lazy(() => import('@/pages/intake/LeadIntake'));

// Settings
const Settings = lazy(() => import('@/pages/public/Settings'));

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/calculator" element={<Calculator />} />
              <Route path="/calculator/results" element={<QuoteResults />} />
              <Route path="/verify-email/:token" element={<VerifyEmail />} />
              <Route path="/invite/:token" element={<AcceptInvite />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/marketplace/:id" element={<AgentProfile />} />
              <Route path="/intake/:agencyCode" element={<LeadIntake />} />
              <Route path="/insurance/request" element={<InsuranceRequestForm />} />
              <Route path="/scenarios/:token/view" element={<ScenarioPublicView />} />
              <Route path="/applications/:token/sign" element={<ApplicationSigningPage />} />
              <Route path="/sso/login/:agencySlug" element={<SsoLogin />} />
              <Route path="/sso/callback" element={<SsoCallback />} />

              {/* Protected: Onboarding (no DashboardLayout) */}
              <Route element={<ProtectedRoute skipOnboardingCheck />}>
                <Route path="/onboarding" element={<Onboarding />} />
              </Route>

              {/* Protected routes (auth guard + DashboardLayout) */}
              <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                {/* Dashboard */}
                <Route path="/dashboard" element={<Dashboard />} />

                {/* Consumer portal */}
                <Route path="/portal/quotes" element={<MyQuotes />} />
                <Route path="/portal/applications" element={<MyApplications />} />
                <Route path="/portal/policies" element={<MyPolicies />} />

                {/* Agent Marketplace */}
                <Route path="/marketplace/requests" element={<AgentMarketplace />} />

                {/* Agent / Agency CRM */}
                <Route path="/crm/leads" element={<Leads />} />
                <Route path="/applications" element={<Applications />} />
                <Route path="/policies" element={<Policies />} />
                <Route path="/commissions" element={<Commissions />} />
                <Route path="/reviews" element={<Reviews />} />

                {/* Messaging & Notifications */}
                <Route path="/messages" element={<Messages />} />
                <Route path="/notifications" element={<Notifications />} />

                {/* Claims */}
                <Route path="/claims" element={<ClaimsPage />} />

                {/* Renewals */}
                <Route path="/renewals" element={<RenewalsPage />} />

                {/* Advanced Analytics */}
                <Route path="/analytics" element={<AdvancedAnalytics />} />

                {/* Documents & E-Signature */}
                <Route path="/documents" element={<DocumentsPage />} />

                {/* Organizations */}
                <Route path="/organizations" element={<OrganizationTree />} />

                {/* Webhooks */}
                <Route path="/webhooks" element={<WebhookSettings />} />

                {/* Calendar */}
                <Route path="/calendar" element={<CalendarPage />} />

                {/* White-Label */}
                <Route path="/white-label" element={<WhiteLabelConfigPage />} />

                {/* Embed Partners */}
                <Route path="/embed" element={<EmbedPartnerDashboard />} />

                {/* Compliance */}
                <Route path="/compliance" element={<ComplianceDashboard />} />

                {/* Data Products & API Keys */}
                <Route path="/data/market-intel" element={<MarketIntelDashboard />} />
                <Route path="/api-keys" element={<ApiKeyManagement />} />

                {/* Recruitment & Training */}
                <Route path="/recruitment" element={<RecruitmentDashboard />} />
                <Route path="/training" element={<TrainingCatalog />} />

                {/* Help Center */}
                <Route path="/help" element={<HelpCenterPage />} />

                {/* Video Meetings */}
                <Route path="/meetings" element={<MeetingsPage />} />
                <Route path="/meetings/:meetingId/room" element={<MeetingRoom />} />

                {/* Phase 6: Ecosystem */}
                <Route path="/forum" element={<ForumHome />} />
                <Route path="/events" element={<EventCalendar />} />
                <Route path="/partners" element={<PartnerDirectory />} />
                <Route path="/campaigns" element={<CampaignBuilder />} />
                <Route path="/reports" element={<ReportBuilder />} />
                <Route path="/reports/ltc-comparison" element={<LtcComparisonReport />} />

                {/* Agency */}
                <Route path="/agency/team" element={<AgencyTeam />} />

                {/* Carrier */}
                <Route path="/carrier/products" element={<Products />} />
                <Route path="/carrier/production" element={<Production />} />
                <Route path="/carrier/api-config" element={<CarrierApiConfigPage />} />

                {/* Admin */}
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/agencies" element={<AdminAgencies />} />
                <Route path="/admin/analytics" element={<AdminAnalytics />} />
                <Route path="/admin/plans" element={<AdminPlans />} />
                <Route path="/admin/products" element={<AdminProducts />} />
                <Route path="/admin/carriers" element={<AdminCarriers />} />
                <Route path="/admin/profiles" element={<AdminProfiles />} />
                <Route path="/admin/audit-log" element={<AdminAuditLog />} />
                <Route path="/admin/sso" element={<SsoConfig />} />
                <Route path="/admin/platform" element={<SuperAdminDashboard />} />
                <Route path="/admin/platform-settings" element={<SuperAdminSettings />} />

                {/* Agency */}
                <Route path="/agency/products" element={<AgencyProducts />} />
                <Route path="/agency/appointments" element={<AgencyAppointments />} />
                <Route path="/agency/settings" element={<AgencySettings />} />

                {/* Settings */}
                <Route path="/settings" element={<Settings />} />
              </Route>
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          <PWAPrompt />
          <Toaster position="top-right" richColors closeButton />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
