import { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PWAPrompt } from '@/components/pwa/PWAPrompt';
import { ChunkErrorBoundary, lazyRetry } from '@/components/ChunkErrorBoundary';

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

// Lazy-loaded pages (with retry on chunk load failure)
// Auth
const Login = lazyRetry(() => import('@/pages/auth/Login'));
const Register = lazyRetry(() => import('@/pages/auth/Register'));
const VerifyEmail = lazyRetry(() => import('@/pages/auth/VerifyEmail'));
const AcceptInvite = lazyRetry(() => import('@/pages/auth/AcceptInvite'));
const ForgotPassword = lazyRetry(() => import('@/pages/auth/ForgotPassword'));
const ResetPassword = lazyRetry(() => import('@/pages/auth/ResetPassword'));
const SsoLogin = lazyRetry(() => import('@/pages/auth/SsoLogin'));
const SsoCallback = lazyRetry(() => import('@/pages/auth/SsoCallback'));

// Onboarding
const Onboarding = lazyRetry(() => import('@/pages/onboarding/Onboarding'));

// Public
const Landing = lazyRetry(() => import('@/pages/public/Landing'));
const Pricing = lazyRetry(() => import('@/pages/public/Pricing'));
const Privacy = lazyRetry(() => import('@/pages/public/Privacy'));
const Terms = lazyRetry(() => import('@/pages/public/Terms'));

// Calculator (public)
const Calculator = lazyRetry(() => import('@/pages/calculator/Calculator'));
const QuoteResults = lazyRetry(() => import('@/pages/calculator/QuoteResults'));

// Marketplace (public)
const Marketplace = lazyRetry(() => import('@/pages/marketplace/Marketplace'));
const AgentProfile = lazyRetry(() => import('@/pages/marketplace/AgentProfile'));
const InsuranceRequestForm = lazyRetry(() => import('@/pages/marketplace/InsuranceRequestForm'));
const ScenarioPublicView = lazyRetry(() => import('@/pages/marketplace/ScenarioPublicView'));
const ApplicationSigningPage = lazyRetry(() => import('@/pages/marketplace/ApplicationSigningPage'));

// Agent Marketplace (protected)
const AgentMarketplace = lazyRetry(() => import('@/pages/marketplace/AgentMarketplace'));
const LeadMarketplace = lazyRetry(() => import('@/pages/marketplace/LeadMarketplace'));

// Dashboard
const Dashboard = lazyRetry(() => import('@/pages/dashboard/Dashboard'));

// Consumer Portal
const MyQuotes = lazyRetry(() => import('@/pages/portal/MyQuotes'));
const MyApplications = lazyRetry(() => import('@/pages/portal/MyApplications'));
const MyPolicies = lazyRetry(() => import('@/pages/portal/MyPolicies'));

// Messaging & Notifications
const Messages = lazyRetry(() => import('@/pages/messages/Messages'));
const Notifications = lazyRetry(() => import('@/pages/notifications/Notifications'));

// Documents & E-Signature
const DocumentsPage = lazyRetry(() => import('@/pages/documents/Documents'));

// Agent / Agency
const Leads = lazyRetry(() => import('@/pages/crm/Leads'));
const Applications = lazyRetry(() => import('@/pages/applications/Applications'));
const Policies = lazyRetry(() => import('@/pages/policies/Policies'));
const Commissions = lazyRetry(() => import('@/pages/analytics/Commissions'));
const Reviews = lazyRetry(() => import('@/pages/analytics/Reviews'));
const AgencyTeam = lazyRetry(() => import('@/pages/admin/AgencyTeam'));

// Claims
const ClaimsPage = lazyRetry(() => import('@/pages/claims/Claims'));

// Renewals
const RenewalsPage = lazyRetry(() => import('@/pages/renewals/Renewals'));

// Carrier
const Products = lazyRetry(() => import('@/pages/carriers/Products'));
const Production = lazyRetry(() => import('@/pages/carriers/Production'));
const CarrierApiConfigPage = lazyRetry(() => import('@/pages/carriers/CarrierApiConfig'));

// Analytics
const AdvancedAnalytics = lazyRetry(() => import('@/pages/analytics/AdvancedAnalytics'));

// Admin
const AdminUsers = lazyRetry(() => import('@/pages/admin/AdminUsers'));
const AdminAgencies = lazyRetry(() => import('@/pages/admin/AdminAgencies'));
const AdminAnalytics = lazyRetry(() => import('@/pages/admin/AdminAnalytics'));
const AdminPlans = lazyRetry(() => import('@/pages/admin/AdminPlans'));
const AdminProducts = lazyRetry(() => import('@/pages/admin/AdminProducts'));
const AdminCarriers = lazyRetry(() => import('@/pages/admin/AdminCarriers'));
const AdminProfiles = lazyRetry(() => import('@/pages/admin/AdminProfiles'));
const AdminAuditLog = lazyRetry(() => import('@/pages/admin/AdminAuditLog'));
const AdminRateTables = lazyRetry(() => import('@/pages/admin/AdminRateTables'));
const AdminRateTableDetail = lazyRetry(() => import('@/pages/admin/AdminRateTableDetail'));
const AdminRateTableForm = lazyRetry(() => import('@/pages/admin/AdminRateTableForm'));
const SuperAdminDashboard = lazyRetry(() => import('@/pages/admin/SuperAdminDashboard'));
const SuperAdminSettings = lazyRetry(() => import('@/pages/admin/SuperAdminSettings'));
const SsoConfig = lazyRetry(() => import('@/pages/admin/SsoConfig'));

// Agency
const AgencyProducts = lazyRetry(() => import('@/pages/agency/AgencyProducts'));
const AgencyAppointments = lazyRetry(() => import('@/pages/agency/AgencyAppointments'));
const AgencySettings = lazyRetry(() => import('@/pages/agency/AgencySettings'));

// Organizations
const OrganizationTree = lazyRetry(() => import('@/pages/organizations/OrganizationTree'));

// Webhooks
const WebhookSettings = lazyRetry(() => import('@/pages/webhooks/WebhookSettings'));

// Calendar
const CalendarPage = lazyRetry(() => import('@/pages/calendar/Calendar'));

// White-Label
const WhiteLabelConfigPage = lazyRetry(() => import('@/pages/whitelabel/WhiteLabelConfig'));

// Embed Partners
const EmbedPartnerDashboard = lazyRetry(() => import('@/pages/embed/EmbedPartnerDashboard'));
const EmbedQuoteWidget = lazyRetry(() => import('@/pages/embed/EmbedQuoteWidget'));

// Compliance
const ComplianceDashboard = lazyRetry(() => import('@/pages/compliance/ComplianceDashboard'));

// Data Products & API Keys
const MarketIntelDashboard = lazyRetry(() => import('@/pages/data/MarketIntelDashboard'));
const ApiKeyManagement = lazyRetry(() => import('@/pages/apikeys/ApiKeyManagement'));

// Recruitment & Training
const RecruitmentDashboard = lazyRetry(() => import('@/pages/recruitment/RecruitmentDashboard'));
const TrainingCatalog = lazyRetry(() => import('@/pages/training/TrainingCatalog'));

// Help Center
const HelpCenterPage = lazyRetry(() => import('@/pages/help/HelpCenter'));

// Phase 6: Ecosystem
const ForumHome = lazyRetry(() => import('@/pages/forum/ForumHome'));
const EventCalendar = lazyRetry(() => import('@/pages/events/EventCalendar'));
const PartnerDirectory = lazyRetry(() => import('@/pages/partners/PartnerDirectory'));
const CampaignBuilder = lazyRetry(() => import('@/pages/campaigns/CampaignBuilder'));
const ReportBuilder = lazyRetry(() => import('@/pages/reports/ReportBuilder'));
const LtcComparisonReport = lazyRetry(() => import('@/pages/reports/LtcComparisonReport'));

// Video Meetings
const MeetingsPage = lazyRetry(() => import('@/pages/meetings/Meetings'));
const MeetingRoom = lazyRetry(() => import('@/pages/meetings/MeetingRoom'));

// Lead Intake (public)
const LeadIntake = lazyRetry(() => import('@/pages/intake/LeadIntake'));

// Settings
const Settings = lazyRetry(() => import('@/pages/public/Settings'));

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AuthProvider>
          <ChunkErrorBoundary>
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
              <Route path="/embed/quote" element={<EmbedQuoteWidget />} />

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
                <Route path="/lead-marketplace" element={<LeadMarketplace />} />

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
                <Route path="/admin/rate-tables" element={<AdminRateTables />} />
                <Route path="/admin/rate-tables/new" element={<AdminRateTableForm />} />
                <Route path="/admin/rate-tables/:id/edit" element={<AdminRateTableForm />} />
                <Route path="/admin/rate-tables/:id" element={<AdminRateTableDetail />} />
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
          </ChunkErrorBoundary>
          <PWAPrompt />
          <Toaster position="top-right" richColors closeButton />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
