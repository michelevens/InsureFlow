<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AgentController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\ApplicationController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CarrierController;
use App\Http\Controllers\CommissionController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\InsuranceProfileController;
use App\Http\Controllers\InviteController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PolicyController;
use App\Http\Controllers\PushSubscriptionController;
use App\Http\Controllers\QuoteController;
use App\Http\Controllers\ReferralController;
use App\Http\Controllers\RoutingRuleController;
use App\Http\Controllers\SignatureController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\PayoutController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\AiChatController;
use App\Http\Controllers\LeadScoringController;
use App\Http\Controllers\ClaimController;
use App\Http\Controllers\RenewalController;
use App\Http\Controllers\SamlController;
use App\Http\Controllers\CarrierApiController;
use App\Http\Controllers\LeadScenarioController;
use App\Http\Controllers\OrganizationController;
use App\Http\Controllers\WebhookController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\WhiteLabelController;
use App\Http\Controllers\EmbedController;
use App\Http\Controllers\DocumentGenerationController;
use App\Http\Controllers\ComplianceController;
use App\Http\Controllers\DataProductController;
use App\Http\Controllers\ApiKeyController;
use App\Http\Controllers\RecruitmentController;
use App\Http\Controllers\TrainingController;
use App\Http\Controllers\HelpCenterController;
use App\Http\Controllers\ForumController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\PartnerMarketplaceController;
use App\Http\Controllers\EmailCampaignController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\VideoMeetingController;
use App\Http\Controllers\RatingController;
use App\Http\Controllers\PlatformSettingController;
use App\Http\Controllers\AgencySettingController;
use App\Http\Controllers\AdminProductController;
use App\Http\Controllers\CompliancePackController;
use App\Http\Controllers\AgencyProductController;
use App\Http\Controllers\ProductVisibilityController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\LeadIntakeController;
use App\Http\Controllers\LeadMarketplaceController;
use App\Http\Controllers\ProfileClaimController;
use App\Http\Controllers\ConsumerMarketplaceController;
use App\Http\Controllers\PublicSigningController;
use App\Http\Controllers\CreditController;
use App\Http\Controllers\AdminRateTableController;
use App\Http\Controllers\ZipCodeController;
use App\Http\Controllers\WorkflowRuleController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\TestimonialController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

// Auth
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/register-from-quote', [AuthController::class, 'registerFromQuote']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::get('/auth/verify-email/{token}', [AuthController::class, 'verifyEmail']);
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);
Route::post('/auth/check-email', [AuthController::class, 'checkEmail']);
Route::post('/auth/demo-login', [AuthController::class, 'demoLogin']);

// Calculator / Quote
Route::post('/calculator/estimate', [QuoteController::class, 'estimate']);
Route::put('/calculator/{quoteRequest}/contact', [QuoteController::class, 'saveContact']);

// Marketplace (public)
Route::get('/marketplace/agents', [AgentController::class, 'index']);
Route::get('/marketplace/agents/{id}', [AgentController::class, 'show']);

// Carriers (public)
Route::get('/carriers', [CarrierController::class, 'index']);
Route::get('/carriers/{carrier}', [CarrierController::class, 'show']);

// Referral validation (public)
Route::post('/referrals/validate', [ReferralController::class, 'validateCode']);
Route::get('/referrals/leaderboard', [ReferralController::class, 'leaderboard']);

// Subscription plans (public listing)
Route::get('/subscription-plans', [SubscriptionController::class, 'plans']);

// Testimonials (public)
Route::get('/testimonials', [TestimonialController::class, 'published']);

// Stripe webhook (no auth)
Route::post('/webhooks/stripe', [SubscriptionController::class, 'handleWebhook']);

// Invites (public — for viewing and accepting)
Route::get('/invites/{token}', [InviteController::class, 'show']);
Route::post('/invites/{token}/accept', [InviteController::class, 'accept']);

// SSO (public — SAML login, ACS callback, metadata)
Route::get('/sso/login/{agencySlug}', [SamlController::class, 'login']);
Route::post('/sso/acs/{agencySlug}', [SamlController::class, 'acs']);
Route::get('/sso/metadata', [SamlController::class, 'metadata']);

// Product visibility (public)
Route::get('/products/visible', [ProductVisibilityController::class, 'visible']);

// Lead intake (public — agencies share these links with potential leads)
Route::get('/intake/{agencyCode}', [LeadIntakeController::class, 'formData']);
Route::post('/intake/{agencyCode}', [LeadIntakeController::class, 'submit']);

// ZIP code lookup (public)
Route::get('/zip-codes/search', [ZipCodeController::class, 'search']);
Route::get('/zip-codes/{zip}', [ZipCodeController::class, 'lookup']);

// Consumer Marketplace (public)
Route::post('/marketplace/insurance/request', [ConsumerMarketplaceController::class, 'submitRequest']);
Route::get('/scenarios/{token}/view', [ConsumerMarketplaceController::class, 'viewScenario']);
Route::post('/scenarios/{token}/respond', [ConsumerMarketplaceController::class, 'respondToScenario']);

// Public Application Signing (no auth)
Route::get('/applications/{token}/view', [PublicSigningController::class, 'view']);
Route::post('/applications/{token}/sign', [PublicSigningController::class, 'sign']);

// Embed widget (public — no auth, API key validated in controller)
Route::get('/embed/config/{apiKey}', [EmbedController::class, 'config']);
Route::post('/embed/quote', [EmbedController::class, 'quote']);
Route::post('/embed/convert', [EmbedController::class, 'markConverted']);

/*
|--------------------------------------------------------------------------
| Protected Routes (auth:sanctum + agency scope)
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum', 'agency.scope'])->group(function () {

    // Auth
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);
    Route::put('/auth/password', [AuthController::class, 'changePassword']);
    Route::post('/auth/resend-verification', [AuthController::class, 'resendVerification']);

    // Onboarding
    Route::get('/onboarding/status', [OnboardingController::class, 'status']);
    Route::get('/onboarding/form-data', [OnboardingController::class, 'formData']);
    Route::post('/onboarding/agency', [OnboardingController::class, 'saveAgency']);
    Route::post('/onboarding/agent', [OnboardingController::class, 'saveAgent']);
    Route::post('/onboarding/complete', [OnboardingController::class, 'complete']);

    // Profile Claim (agents claim pre-imported profiles)
    Route::get('/profiles/search', [ProfileClaimController::class, 'search']);
    Route::post('/profiles/{profile}/claim', [ProfileClaimController::class, 'claim']);

    // Dashboard stats
    Route::get('/stats/dashboard', [AnalyticsController::class, 'dashboard']);

    // Advanced Analytics
    Route::get('/analytics/conversion-funnel', [AnalyticsController::class, 'conversionFunnel']);
    Route::get('/analytics/revenue-trends', [AnalyticsController::class, 'revenueTrends']);
    Route::get('/analytics/agent-performance', [AnalyticsController::class, 'agentPerformance']);
    Route::get('/analytics/claims', [AnalyticsController::class, 'claimsAnalytics']);

    // Consumer Marketplace (protected)
    Route::get('/consumer/dashboard', [ConsumerMarketplaceController::class, 'consumerDashboard']);
    Route::get('/marketplace/insurance/requests', [ConsumerMarketplaceController::class, 'listOpenRequests']);
    Route::post('/marketplace/insurance/requests/{quoteRequest}/unlock', [ConsumerMarketplaceController::class, 'unlockRequest']);
    Route::post('/crm/leads/{lead}/scenarios/{scenario}/send-to-consumer', [ConsumerMarketplaceController::class, 'sendToConsumer']);
    Route::post('/applications/create-from-scenario/{scenario}', [PublicSigningController::class, 'createFromScenario']);

    // Credits
    Route::get('/credits/balance', [CreditController::class, 'balance']);
    Route::get('/credits/history', [CreditController::class, 'history']);

    // Quotes
    Route::get('/quotes', [QuoteController::class, 'myQuotes']);
    Route::get('/quotes/{quoteRequest}', [QuoteController::class, 'show']);

    // Quote Drafts (save & resume)
    Route::get('/calculator/draft', [QuoteController::class, 'getDraft']);
    Route::post('/calculator/draft', [QuoteController::class, 'saveDraft']);
    Route::delete('/calculator/draft', [QuoteController::class, 'deleteDraft']);

    // --- Unified Insurance Profiles (UIP) ---
    Route::get('/profiles', [InsuranceProfileController::class, 'index']);
    Route::get('/profiles/pipeline', [InsuranceProfileController::class, 'pipeline']);
    Route::get('/profiles/{profile}', [InsuranceProfileController::class, 'show']);
    Route::put('/profiles/{profile}', [InsuranceProfileController::class, 'update']);
    Route::post('/profiles/{profile}/advance', [InsuranceProfileController::class, 'advanceStage']);
    Route::post('/profiles/{profile}/reassign', [InsuranceProfileController::class, 'reassign']);

    // --- Lead Scoring ---
    Route::get('/profiles/{profileId}/score', [LeadScoringController::class, 'score']);
    Route::post('/engagement/track', [LeadScoringController::class, 'trackEngagement']);
    Route::get('/lead-scores/top', [LeadScoringController::class, 'topLeads']);
    Route::post('/lead-scores/rescore', [LeadScoringController::class, 'rescoreAll']);

    // --- Routing Rules (agency owners + admins) ---
    Route::get('/routing-rules', [RoutingRuleController::class, 'index']);
    Route::post('/routing-rules', [RoutingRuleController::class, 'store']);
    Route::put('/routing-rules/{rule}', [RoutingRuleController::class, 'update']);
    Route::delete('/routing-rules/{rule}', [RoutingRuleController::class, 'destroy']);

    // Applications
    Route::get('/applications', [ApplicationController::class, 'index']);
    Route::post('/applications', [ApplicationController::class, 'store']);
    Route::get('/applications/{application}', [ApplicationController::class, 'show']);
    Route::post('/applications/{application}/submit', [ApplicationController::class, 'submit']);
    Route::put('/applications/{application}/status', [ApplicationController::class, 'updateStatus']);

    // Policies
    Route::get('/policies', [PolicyController::class, 'index']);
    Route::post('/policies', [PolicyController::class, 'store']);
    Route::get('/policies/{policy}', [PolicyController::class, 'show']);
    Route::put('/policies/{policy}/status', [PolicyController::class, 'updateStatus']);

    // Claims
    Route::get('/claims', [ClaimController::class, 'index']);
    Route::post('/claims', [ClaimController::class, 'store']);
    Route::get('/claims/{claim}', [ClaimController::class, 'show']);
    Route::put('/claims/{claim}/status', [ClaimController::class, 'updateStatus']);
    Route::post('/claims/{claim}/notes', [ClaimController::class, 'addNote']);

    // Renewals
    Route::get('/renewals', [RenewalController::class, 'index']);
    Route::get('/renewals/dashboard', [RenewalController::class, 'dashboard']);
    Route::get('/renewals/{renewal}', [RenewalController::class, 'show']);
    Route::put('/renewals/{renewal}/status', [RenewalController::class, 'updateStatus']);

    // CRM - Leads
    Route::get('/crm/leads', [LeadController::class, 'index']);
    Route::post('/crm/leads', [LeadController::class, 'store']);
    Route::get('/crm/leads/{lead}', [LeadController::class, 'show']);
    Route::put('/crm/leads/{lead}', [LeadController::class, 'update']);
    Route::post('/crm/leads/{lead}/activity', [LeadController::class, 'addActivity']);
    Route::put('/crm/leads/bulk-status', [LeadController::class, 'bulkUpdateStatus']);

    // Lead Scenarios (nested under leads)
    Route::get('/crm/leads/{lead}/scenarios', [LeadScenarioController::class, 'index']);
    Route::post('/crm/leads/{lead}/scenarios', [LeadScenarioController::class, 'store']);
    Route::get('/crm/leads/{lead}/scenarios/{scenario}', [LeadScenarioController::class, 'show']);
    Route::put('/crm/leads/{lead}/scenarios/{scenario}', [LeadScenarioController::class, 'update']);
    Route::delete('/crm/leads/{lead}/scenarios/{scenario}', [LeadScenarioController::class, 'destroy']);

    // Scenario — Insured Objects
    Route::post('/crm/leads/{lead}/scenarios/{scenario}/objects', [LeadScenarioController::class, 'addInsuredObject']);
    Route::put('/crm/leads/{lead}/scenarios/{scenario}/objects/{object}', [LeadScenarioController::class, 'updateInsuredObject']);
    Route::delete('/crm/leads/{lead}/scenarios/{scenario}/objects/{object}', [LeadScenarioController::class, 'removeInsuredObject']);

    // Scenario — Coverages
    Route::post('/crm/leads/{lead}/scenarios/{scenario}/coverages', [LeadScenarioController::class, 'addCoverage']);
    Route::put('/crm/leads/{lead}/scenarios/{scenario}/coverages/{coverage}', [LeadScenarioController::class, 'updateCoverage']);
    Route::delete('/crm/leads/{lead}/scenarios/{scenario}/coverages/{coverage}', [LeadScenarioController::class, 'removeCoverage']);

    // Scenario — Convert to Application
    Route::post('/crm/leads/{lead}/scenarios/{scenario}/convert', [LeadScenarioController::class, 'convertToApplication']);

    // Scenario — Carrier Quotes (multi-carrier comparison)
    Route::post('/crm/leads/{lead}/scenarios/{scenario}/quotes', [LeadScenarioController::class, 'addQuote']);
    Route::put('/crm/leads/{lead}/scenarios/{scenario}/quotes/{quote}', [LeadScenarioController::class, 'updateQuote']);
    Route::delete('/crm/leads/{lead}/scenarios/{scenario}/quotes/{quote}', [LeadScenarioController::class, 'removeQuote']);
    Route::post('/crm/leads/{lead}/scenarios/{scenario}/quotes/{quote}/select', [LeadScenarioController::class, 'selectQuote']);

    // Scenario — Proposal PDF
    Route::post('/crm/leads/{lead}/scenarios/{scenario}/proposal', [LeadScenarioController::class, 'generateProposal']);

    // Reference data (product types, suggested coverages)
    Route::get('/insurance/product-types', [LeadScenarioController::class, 'productTypes']);
    Route::get('/insurance/suggested-coverages/{productType}', [LeadScenarioController::class, 'suggestedCoverages']);

    // --- Rating Engine ---
    Route::post('/rate/scenario/{scenarioId}', [RatingController::class, 'rateScenario']);
    Route::get('/rate/options/{productType}', [RatingController::class, 'productOptions']);
    Route::get('/rate/audit/{runId}', [RatingController::class, 'auditRun']);
    Route::get('/rate/history/{scenarioId}', [RatingController::class, 'scenarioHistory']);
    Route::get('/rate/products', [RatingController::class, 'registeredProducts']);

    // Commissions
    Route::get('/commissions', [CommissionController::class, 'index']);
    Route::get('/commissions/{commission}', [CommissionController::class, 'show']);
    Route::get('/commissions/{commission}/splits', [CommissionController::class, 'splits']);
    Route::post('/commissions/{commission}/splits', [CommissionController::class, 'storeSplit']);
    Route::put('/commissions/{commission}/splits/{split}', [CommissionController::class, 'updateSplit']);
    Route::delete('/commissions/{commission}/splits/{split}', [CommissionController::class, 'destroySplit']);

    // Workflow Automation Rules
    Route::get('/workflows/options', [WorkflowRuleController::class, 'options']);
    Route::get('/workflows/executions', [WorkflowRuleController::class, 'executions']);
    Route::get('/workflows', [WorkflowRuleController::class, 'index']);
    Route::post('/workflows', [WorkflowRuleController::class, 'store']);
    Route::get('/workflows/{rule}', [WorkflowRuleController::class, 'show']);
    Route::put('/workflows/{rule}', [WorkflowRuleController::class, 'update']);
    Route::delete('/workflows/{rule}', [WorkflowRuleController::class, 'destroy']);
    Route::post('/workflows/{rule}/toggle', [WorkflowRuleController::class, 'toggle']);
    Route::post('/workflows/{rule}/test', [WorkflowRuleController::class, 'test']);

    // Task Management
    Route::get('/tasks', [TaskController::class, 'index']);
    Route::post('/tasks', [TaskController::class, 'store']);
    Route::put('/tasks/{task}', [TaskController::class, 'update']);
    Route::post('/tasks/{task}/complete', [TaskController::class, 'complete']);
    Route::post('/tasks/{task}/reopen', [TaskController::class, 'reopen']);
    Route::delete('/tasks/{task}', [TaskController::class, 'destroy']);

    // Agent profile
    Route::put('/agent/profile', [AgentController::class, 'updateProfile']);
    Route::get('/agents/{agentId}/reviews', [AgentController::class, 'reviews']);
    Route::post('/agents/{agentId}/reviews', [AgentController::class, 'storeReview']);
    Route::put('/reviews/{review}/reply', [AgentController::class, 'replyToReview']);

    // Carrier products
    Route::get('/carrier/products', [CarrierController::class, 'products']);
    Route::post('/carrier/products', [CarrierController::class, 'storeProduct']);
    Route::put('/carrier/products/{product}', [CarrierController::class, 'updateProduct']);
    Route::get('/carrier/production', [CarrierController::class, 'production']);

    // Subscriptions & Billing
    Route::get('/subscriptions/current', [SubscriptionController::class, 'current']);
    Route::post('/subscriptions/checkout', [SubscriptionController::class, 'checkout']);
    Route::post('/subscriptions/cancel', [SubscriptionController::class, 'cancel']);
    Route::post('/subscriptions/resume', [SubscriptionController::class, 'resume']);
    Route::post('/subscriptions/portal', [SubscriptionController::class, 'portal']);
    Route::get('/billing/overview', [SubscriptionController::class, 'billingOverview']);

    // Referrals
    Route::get('/referrals/dashboard', [ReferralController::class, 'dashboard']);
    Route::post('/referrals/apply', [ReferralController::class, 'applyCode']);

    // Messaging
    Route::get('/conversations', [MessageController::class, 'conversations']);
    Route::post('/conversations', [MessageController::class, 'startConversation']);
    Route::get('/conversations/users', [MessageController::class, 'searchUsers']);
    Route::get('/conversations/{id}/messages', [MessageController::class, 'messages']);
    Route::post('/conversations/{id}/messages', [MessageController::class, 'send']);
    Route::get('/conversations/{id}/new-messages', [MessageController::class, 'newMessages']);
    Route::post('/conversations/{id}/typing', [MessageController::class, 'typing']);
    Route::get('/conversations/{id}/typing', [MessageController::class, 'typingStatus']);
    Route::put('/messages/{id}/read', [MessageController::class, 'markRead']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);

    // Push Subscriptions
    Route::get('/push/vapid-key', [PushSubscriptionController::class, 'vapidKey']);
    Route::post('/push/subscribe', [PushSubscriptionController::class, 'subscribe']);
    Route::post('/push/unsubscribe', [PushSubscriptionController::class, 'unsubscribe']);

    // Documents
    Route::get('/documents', [DocumentController::class, 'index']);
    Route::post('/documents', [DocumentController::class, 'store']);
    Route::get('/documents/{document}/download', [DocumentController::class, 'download']);
    Route::delete('/documents/{document}', [DocumentController::class, 'destroy']);

    // E-Signatures
    Route::get('/signatures/pending', [SignatureController::class, 'myPending']);
    Route::get('/applications/{application}/signatures', [SignatureController::class, 'index']);
    Route::post('/applications/{application}/signatures', [SignatureController::class, 'requestSignature']);
    Route::put('/signatures/{signature}/sign', [SignatureController::class, 'sign']);
    Route::put('/signatures/{signature}/reject', [SignatureController::class, 'reject']);

    // Payouts (Stripe Connect)
    Route::post('/payouts/connect-account', [PayoutController::class, 'createConnectAccount']);
    Route::get('/payouts/connect-status', [PayoutController::class, 'connectAccountStatus']);
    Route::post('/payouts/connect-refresh', [PayoutController::class, 'refreshConnectLink']);
    Route::post('/payouts/request', [PayoutController::class, 'requestPayout']);
    Route::get('/payouts/history', [PayoutController::class, 'history']);

    // Audit Logs (entity-level)
    Route::get('/audit-logs/{entityType}/{entityId}', [AuditLogController::class, 'forEntity']);

    // AI Chat
    Route::get('/ai/conversations', [AiChatController::class, 'conversations']);
    Route::get('/ai/conversations/{conversationId}/messages', [AiChatController::class, 'messages']);
    Route::post('/ai/chat', [AiChatController::class, 'chat']);
    Route::get('/ai/suggestions', [AiChatController::class, 'suggestions']);
    Route::delete('/ai/conversations/{conversationId}', [AiChatController::class, 'deleteConversation']);

    // Agency invites (agency owners invite agents)
    Route::get('/agency/invites', [InviteController::class, 'agencyInvites']);
    Route::post('/agency/invites', [InviteController::class, 'agencyInvite']);

    // Agency product configuration (agency owners)
    Route::get('/agency/products', [AgencyProductController::class, 'index']);
    Route::put('/agency/products', [AgencyProductController::class, 'update']);
    Route::put('/agency/products/{product}/toggle', [AgencyProductController::class, 'toggleProduct']);

    // Agency carrier appointments
    Route::get('/agency/appointments', [AgencyProductController::class, 'appointments']);
    Route::post('/agency/appointments', [AgencyProductController::class, 'storeAppointment']);
    Route::put('/agency/appointments/carrier/{carrier}', [AgencyProductController::class, 'syncCarrierAppointments']);
    Route::delete('/agency/appointments/{appointment}', [AgencyProductController::class, 'destroyAppointment']);

    // SSO Configuration (admin/agency_owner)
    Route::post('/sso/configure', [SamlController::class, 'configure']);
    Route::post('/sso/disable/{agency}', [SamlController::class, 'disable']);

    // Carrier API Integration
    Route::get('/carrier-api/configs', [CarrierApiController::class, 'index']);
    Route::post('/carrier-api/configs', [CarrierApiController::class, 'store']);
    Route::get('/carrier-api/configs/{config}', [CarrierApiController::class, 'show']);
    Route::put('/carrier-api/configs/{config}', [CarrierApiController::class, 'update']);
    Route::delete('/carrier-api/configs/{config}', [CarrierApiController::class, 'destroy']);
    Route::post('/carrier-api/configs/{config}/test', [CarrierApiController::class, 'test']);
    Route::post('/carrier-api/configs/{config}/test-connection', [CarrierApiController::class, 'testConnection']);
    Route::get('/carrier-api/configs/{config}/logs', [CarrierApiController::class, 'logs']);
    Route::get('/carrier-api/adapters', [CarrierApiController::class, 'availableAdapters']);
    Route::post('/carrier-api/live-rates', [CarrierApiController::class, 'getLiveRates']);
    Route::post('/carrier-api/adapter-quotes', [CarrierApiController::class, 'getAdapterQuotes']);

    // Organizations (MGA hierarchy)
    Route::get('/organizations', [OrganizationController::class, 'index']);
    Route::post('/organizations', [OrganizationController::class, 'store']);
    Route::get('/organizations/{organization}/tree', [OrganizationController::class, 'tree']);
    Route::put('/organizations/{organization}', [OrganizationController::class, 'update']);
    Route::delete('/organizations/{organization}', [OrganizationController::class, 'destroy']);
    Route::get('/organizations/{organization}/members', [OrganizationController::class, 'members']);
    Route::post('/organizations/{organization}/members', [OrganizationController::class, 'addMember']);
    Route::put('/organizations/{organization}/members/{member}', [OrganizationController::class, 'updateMember']);
    Route::delete('/organizations/{organization}/members/{member}', [OrganizationController::class, 'removeMember']);

    // Webhooks
    Route::get('/webhooks', [WebhookController::class, 'index']);
    Route::post('/webhooks', [WebhookController::class, 'store']);
    Route::put('/webhooks/{webhook}', [WebhookController::class, 'update']);
    Route::delete('/webhooks/{webhook}', [WebhookController::class, 'destroy']);
    Route::get('/webhooks/{webhook}/deliveries', [WebhookController::class, 'deliveries']);
    Route::post('/webhooks/{webhook}/test', [WebhookController::class, 'test']);
    Route::post('/webhook-deliveries/{delivery}/retry', [WebhookController::class, 'retry']);
    Route::get('/webhooks/event-types', [WebhookController::class, 'eventTypes']);

    // Video Meetings
    Route::get('/meetings', [VideoMeetingController::class, 'index']);
    Route::post('/meetings', [VideoMeetingController::class, 'store']);
    Route::get('/meetings/settings', [VideoMeetingController::class, 'getSettings']);
    Route::put('/meetings/settings', [VideoMeetingController::class, 'updateSettings']);
    Route::get('/meetings/token/{token}', [VideoMeetingController::class, 'showByToken']);
    Route::get('/meetings/{meetingId}', [VideoMeetingController::class, 'show']);
    Route::post('/meetings/{meetingId}/start', [VideoMeetingController::class, 'start']);
    Route::post('/meetings/{meetingId}/end', [VideoMeetingController::class, 'end']);
    Route::post('/meetings/{meetingId}/cancel', [VideoMeetingController::class, 'cancel']);
    Route::get('/meetings/{meetingId}/link', [VideoMeetingController::class, 'generateLink']);

    // Appointments & Calendar
    Route::get('/appointments', [AppointmentController::class, 'index']);
    Route::post('/appointments', [AppointmentController::class, 'store']);
    Route::get('/appointments/{appointment}', [AppointmentController::class, 'show']);
    Route::put('/appointments/{appointment}', [AppointmentController::class, 'update']);
    Route::put('/appointments/{appointment}/status', [AppointmentController::class, 'updateStatus']);
    Route::delete('/appointments/{appointment}', [AppointmentController::class, 'destroy']);
    Route::get('/availability', [AppointmentController::class, 'getAvailability']);
    Route::post('/availability', [AppointmentController::class, 'setAvailability']);
    Route::get('/blocked-dates', [AppointmentController::class, 'getBlockedDates']);
    Route::post('/blocked-dates', [AppointmentController::class, 'blockDate']);
    Route::delete('/blocked-dates/{blockedDate}', [AppointmentController::class, 'unblockDate']);
    Route::get('/available-slots', [AppointmentController::class, 'availableSlots']);

    // White-Label
    Route::get('/white-label', [WhiteLabelController::class, 'index']);
    Route::post('/white-label', [WhiteLabelController::class, 'store']);
    Route::get('/white-label/{config}', [WhiteLabelController::class, 'show']);
    Route::put('/white-label/{config}', [WhiteLabelController::class, 'update']);
    Route::delete('/white-label/{config}', [WhiteLabelController::class, 'destroy']);
    Route::post('/white-label/{config}/domains', [WhiteLabelController::class, 'addDomain']);
    Route::post('/white-label/domains/{domain}/verify', [WhiteLabelController::class, 'verifyDomain']);
    Route::delete('/white-label/domains/{domain}', [WhiteLabelController::class, 'removeDomain']);
    Route::get('/white-label/{config}/preview', [WhiteLabelController::class, 'preview']);

    // Embed Partners (admin)
    Route::get('/embed/partners', [EmbedController::class, 'index']);
    Route::post('/embed/partners', [EmbedController::class, 'store']);
    Route::get('/embed/partners/{partner}', [EmbedController::class, 'show']);
    Route::put('/embed/partners/{partner}', [EmbedController::class, 'update']);
    Route::delete('/embed/partners/{partner}', [EmbedController::class, 'destroy']);
    Route::post('/embed/partners/{partner}/regenerate-key', [EmbedController::class, 'regenerateKey']);
    Route::get('/embed/partners/{partner}/sessions', [EmbedController::class, 'sessions']);
    Route::get('/embed/partners/{partner}/analytics', [EmbedController::class, 'analytics']);
    Route::get('/embed/partners/{partner}/widget-code', [EmbedController::class, 'widgetCode']);
    Route::post('/embed/partners/{partner}/test-webhook', [EmbedController::class, 'testWebhook']);

    // Document Generation
    Route::get('/documents/generate/templates', [DocumentGenerationController::class, 'templates']);
    Route::post('/documents/generate/{type}', [DocumentGenerationController::class, 'generate']);
    Route::get('/documents/generated', [DocumentGenerationController::class, 'index']);
    Route::get('/documents/generated/{document}/download', [DocumentGenerationController::class, 'download']);
    Route::delete('/documents/generated/{document}', [DocumentGenerationController::class, 'destroy']);

    // Compliance Tracking
    Route::get('/compliance/alerts', [ComplianceController::class, 'alerts']);
    Route::get('/compliance/dashboard', [ComplianceController::class, 'dashboard']);
    Route::get('/compliance/licenses', [ComplianceController::class, 'licenses']);
    Route::post('/compliance/licenses', [ComplianceController::class, 'storeLicense']);
    Route::put('/compliance/licenses/{license}', [ComplianceController::class, 'updateLicense']);
    Route::delete('/compliance/licenses/{license}', [ComplianceController::class, 'destroyLicense']);
    Route::get('/compliance/ce-credits', [ComplianceController::class, 'ceCredits']);
    Route::post('/compliance/ce-credits', [ComplianceController::class, 'storeCeCredit']);
    Route::put('/compliance/ce-credits/{credit}', [ComplianceController::class, 'updateCeCredit']);
    Route::delete('/compliance/ce-credits/{credit}', [ComplianceController::class, 'destroyCeCredit']);
    Route::get('/compliance/eo-policies', [ComplianceController::class, 'eoPolicy']);
    Route::post('/compliance/eo-policies', [ComplianceController::class, 'storeEoPolicy']);
    Route::put('/compliance/eo-policies/{eoPolicy}', [ComplianceController::class, 'updateEoPolicy']);
    Route::delete('/compliance/eo-policies/{eoPolicy}', [ComplianceController::class, 'destroyEoPolicy']);
    Route::get('/compliance/expiring', [ComplianceController::class, 'expiring']);

    // Compliance Pack
    Route::get('/compliance/pack', [CompliancePackController::class, 'index']);
    Route::post('/compliance/pack/generate', [CompliancePackController::class, 'generate']);
    Route::put('/compliance/pack/{item}', [CompliancePackController::class, 'update']);

    // Data Products & Market Intelligence
    Route::get('/data/subscriptions', [DataProductController::class, 'subscriptions']);
    Route::post('/data/subscriptions', [DataProductController::class, 'subscribe']);
    Route::delete('/data/subscriptions/{subscription}', [DataProductController::class, 'cancelSubscription']);
    Route::get('/data/market-intel', [DataProductController::class, 'marketIntel']);
    Route::get('/data/competitive-analysis', [DataProductController::class, 'competitiveAnalysis']);
    Route::get('/data/agent-benchmarking', [DataProductController::class, 'agentBenchmarking']);
    Route::get('/data/reports', [DataProductController::class, 'reports']);
    Route::post('/data/reports/generate', [DataProductController::class, 'generateReport']);
    Route::get('/data/reports/{report}/download', [DataProductController::class, 'downloadReport']);

    // API Keys
    Route::get('/api-keys', [ApiKeyController::class, 'index']);
    Route::post('/api-keys', [ApiKeyController::class, 'store']);
    Route::put('/api-keys/{apiKey}', [ApiKeyController::class, 'update']);
    Route::delete('/api-keys/{apiKey}', [ApiKeyController::class, 'destroy']);
    Route::post('/api-keys/{apiKey}/regenerate', [ApiKeyController::class, 'regenerate']);
    Route::get('/api-keys/{apiKey}/usage', [ApiKeyController::class, 'usage']);
    Route::get('/api-keys/{apiKey}/logs', [ApiKeyController::class, 'logs']);
    Route::get('/api-keys/permissions', [ApiKeyController::class, 'permissions']);

    // Recruitment
    Route::get('/recruitment/postings', [RecruitmentController::class, 'index']);
    Route::post('/recruitment/postings', [RecruitmentController::class, 'store']);
    Route::get('/recruitment/postings/{posting}', [RecruitmentController::class, 'show']);
    Route::put('/recruitment/postings/{posting}', [RecruitmentController::class, 'update']);
    Route::delete('/recruitment/postings/{posting}', [RecruitmentController::class, 'destroy']);
    Route::get('/recruitment/postings/{posting}/applications', [RecruitmentController::class, 'applications']);
    Route::get('/recruitment/applications/{application}', [RecruitmentController::class, 'showApplication']);
    Route::put('/recruitment/applications/{application}', [RecruitmentController::class, 'updateApplication']);
    Route::get('/recruitment/jobs', [RecruitmentController::class, 'publicJobs']);
    Route::post('/recruitment/jobs/{posting}/apply', [RecruitmentController::class, 'apply']);

    // Training
    Route::get('/training/modules', [TrainingController::class, 'index']);
    Route::post('/training/modules', [TrainingController::class, 'store']);
    Route::get('/training/modules/{module}', [TrainingController::class, 'show']);
    Route::put('/training/modules/{module}', [TrainingController::class, 'update']);
    Route::delete('/training/modules/{module}', [TrainingController::class, 'destroy']);
    Route::get('/training/catalog', [TrainingController::class, 'catalog']);
    Route::post('/training/modules/{module}/start', [TrainingController::class, 'startModule']);
    Route::post('/training/modules/{module}/complete', [TrainingController::class, 'completeModule']);
    Route::get('/training/progress', [TrainingController::class, 'progress']);
    Route::get('/training/categories', [TrainingController::class, 'categories']);

    // Help Center
    Route::get('/help/categories', [HelpCenterController::class, 'categories']);
    Route::get('/help/categories/{slug}/articles', [HelpCenterController::class, 'articlesByCategory']);
    Route::get('/help/articles/{slug}', [HelpCenterController::class, 'showArticle']);
    Route::get('/help/search', [HelpCenterController::class, 'search']);
    Route::post('/help/articles/{article}/vote', [HelpCenterController::class, 'vote']);

    // Forum
    Route::get('/forum/categories', [ForumController::class, 'categories']);
    Route::post('/forum/categories', [ForumController::class, 'storeCategory']);
    Route::get('/forum/categories/{categoryId}/topics', [ForumController::class, 'topics']);
    Route::get('/forum/topics/{topicId}', [ForumController::class, 'showTopic']);
    Route::post('/forum/topics', [ForumController::class, 'storeTopic']);
    Route::put('/forum/topics/{topicId}', [ForumController::class, 'updateTopic']);
    Route::delete('/forum/topics/{topicId}', [ForumController::class, 'destroyTopic']);
    Route::post('/forum/topics/{topicId}/posts', [ForumController::class, 'storePost']);
    Route::put('/forum/posts/{postId}', [ForumController::class, 'updatePost']);
    Route::delete('/forum/posts/{postId}', [ForumController::class, 'destroyPost']);
    Route::post('/forum/posts/{postId}/vote', [ForumController::class, 'vote']);
    Route::post('/forum/posts/{postId}/solution', [ForumController::class, 'markSolution']);

    // Events
    Route::get('/events', [EventController::class, 'index']);
    Route::post('/events', [EventController::class, 'store']);
    Route::get('/events/my', [EventController::class, 'myEvents']);
    Route::get('/events/{eventId}', [EventController::class, 'show']);
    Route::put('/events/{eventId}', [EventController::class, 'update']);
    Route::delete('/events/{eventId}', [EventController::class, 'destroy']);
    Route::post('/events/{eventId}/register', [EventController::class, 'register']);
    Route::post('/events/{eventId}/cancel-registration', [EventController::class, 'cancelRegistration']);
    Route::post('/events/{eventId}/attend/{userId}', [EventController::class, 'attend']);

    // Partner Marketplace
    Route::get('/partners', [PartnerMarketplaceController::class, 'index']);
    Route::post('/partners', [PartnerMarketplaceController::class, 'store']);
    Route::get('/partners/referrals', [PartnerMarketplaceController::class, 'referrals']);
    Route::get('/partners/{listingId}', [PartnerMarketplaceController::class, 'show']);
    Route::put('/partners/{listingId}', [PartnerMarketplaceController::class, 'update']);
    Route::delete('/partners/{listingId}', [PartnerMarketplaceController::class, 'destroy']);
    Route::post('/partners/{listingId}/refer', [PartnerMarketplaceController::class, 'refer']);
    Route::put('/partners/referrals/{referralId}', [PartnerMarketplaceController::class, 'updateReferral']);
    Route::post('/partners/{listingId}/verify', [PartnerMarketplaceController::class, 'verify']);

    // Email Campaigns
    Route::get('/email/templates', [EmailCampaignController::class, 'templates']);
    Route::post('/email/templates', [EmailCampaignController::class, 'storeTemplate']);
    Route::put('/email/templates/{templateId}', [EmailCampaignController::class, 'updateTemplate']);
    Route::delete('/email/templates/{templateId}', [EmailCampaignController::class, 'destroyTemplate']);
    Route::get('/email/campaigns', [EmailCampaignController::class, 'campaigns']);
    Route::post('/email/campaigns', [EmailCampaignController::class, 'storeCampaign']);
    Route::get('/email/campaigns/{campaignId}', [EmailCampaignController::class, 'showCampaign']);
    Route::put('/email/campaigns/{campaignId}', [EmailCampaignController::class, 'updateCampaign']);
    Route::delete('/email/campaigns/{campaignId}', [EmailCampaignController::class, 'destroyCampaign']);
    Route::post('/email/campaigns/{campaignId}/send', [EmailCampaignController::class, 'sendCampaign']);
    Route::post('/email/campaigns/{campaignId}/cancel', [EmailCampaignController::class, 'cancelCampaign']);
    Route::get('/email/campaigns/{campaignId}/analytics', [EmailCampaignController::class, 'campaignAnalytics']);
    Route::get('/email/campaigns/{campaignId}/sends', [EmailCampaignController::class, 'campaignSends']);

    // Reports & BI Export
    Route::get('/reports', [ReportController::class, 'index']);
    Route::post('/reports', [ReportController::class, 'store']);
    Route::get('/reports/{reportId}', [ReportController::class, 'show']);
    Route::put('/reports/{reportId}', [ReportController::class, 'update']);
    Route::delete('/reports/{reportId}', [ReportController::class, 'destroy']);
    Route::post('/reports/{reportId}/run', [ReportController::class, 'run']);
    Route::get('/reports/{reportId}/runs', [ReportController::class, 'runs']);
    Route::get('/report-runs/{runId}/download', [ReportController::class, 'download']);
    Route::post('/report-runs/{runId}/email', [ReportController::class, 'emailRun']);
    Route::post('/export/csv', [ReportController::class, 'exportCsv']);
    Route::post('/export/json', [ReportController::class, 'exportJson']);
    Route::post('/reports/ltc-comparison', [ReportController::class, 'generateLtcComparison']);

    /*
    |----------------------------------------------------------------------
    | Admin Routes
    |----------------------------------------------------------------------
    */

    Route::prefix('admin')->middleware('role.admin')->group(function () {
        // Users
        Route::get('/users', [AdminController::class, 'users']);
        Route::get('/users/{user}', [AdminController::class, 'showUser']);
        Route::put('/users/{user}', [AdminController::class, 'updateUser']);
        Route::put('/users/{user}/approve', [AdminController::class, 'approveUser']);
        Route::put('/users/{user}/deactivate', [AdminController::class, 'deactivateUser']);

        // Agencies
        Route::get('/agencies', [AdminController::class, 'agencies']);
        Route::get('/agencies/{agency}', [AdminController::class, 'showAgency']);
        Route::put('/agencies/{agency}', [AdminController::class, 'updateAgency']);

        // Subscription Plans
        Route::get('/plans', [AdminController::class, 'plans']);
        Route::post('/plans', [AdminController::class, 'storePlan']);
        Route::put('/plans/{plan}', [AdminController::class, 'updatePlan']);
        Route::delete('/plans/{plan}', [AdminController::class, 'deletePlan']);

        // Analytics
        Route::get('/analytics', [AdminController::class, 'analytics']);

        // Audit Logs
        Route::get('/audit-logs', [AuditLogController::class, 'index']);

        // Invites (admin invites agents/agency_owners/carriers)
        Route::get('/invites', [InviteController::class, 'adminListInvites']);
        Route::post('/invites', [InviteController::class, 'adminInvite']);

        // Platform Products
        Route::get('/products', [AdminProductController::class, 'index']);
        Route::put('/products/{product}', [AdminProductController::class, 'update']);
        Route::put('/products/{product}/toggle', [AdminProductController::class, 'toggle']);
        Route::post('/products/bulk-toggle', [AdminProductController::class, 'bulkToggle']);
        Route::post('/products/sync', [AdminProductController::class, 'sync']);

        // Help Center Admin
        Route::get('/help/articles', [HelpCenterController::class, 'adminListArticles']);
        Route::post('/help/articles', [HelpCenterController::class, 'storeArticle']);
        Route::put('/help/articles/{article}', [HelpCenterController::class, 'updateArticle']);
        Route::delete('/help/articles/{article}', [HelpCenterController::class, 'destroyArticle']);
        Route::post('/help/categories', [HelpCenterController::class, 'storeCategory']);
        Route::put('/help/categories/{category}', [HelpCenterController::class, 'updateCategory']);
        Route::delete('/help/categories/{category}', [HelpCenterController::class, 'destroyCategory']);

        // Platform Settings (superadmin)
        Route::get('/settings', [PlatformSettingController::class, 'index']);
        Route::put('/settings', [PlatformSettingController::class, 'update']);
        Route::post('/settings/test-email', [PlatformSettingController::class, 'testEmail']);
        Route::post('/settings/test-stripe', [PlatformSettingController::class, 'testStripe']);
        Route::get('/settings/system-health', [PlatformSettingController::class, 'systemHealth']);

        // Admin User Management
        Route::post('/users', [AdminController::class, 'createUser']);
        Route::post('/users/{user}/reset-password', [AdminController::class, 'resetPassword']);

        // Admin Carrier Management
        Route::get('/carriers', [AdminController::class, 'carriers']);
        Route::post('/carriers', [AdminController::class, 'storeCarrier']);
        Route::get('/carriers/{carrier}', [AdminController::class, 'showCarrier']);
        Route::put('/carriers/{carrier}', [AdminController::class, 'updateCarrier']);

        // NPN Verification
        Route::post('/agents/{profile}/verify-npn', [AdminController::class, 'verifyNpn']);
        Route::post('/agencies/{agency}/verify-npn', [AdminController::class, 'verifyAgencyNpn']);

        // Compliance Requirements Management (superadmin)
        Route::get('/compliance/requirements', [CompliancePackController::class, 'requirements']);
        Route::post('/compliance/requirements', [CompliancePackController::class, 'storeRequirement']);
        Route::put('/compliance/requirements/{requirement}', [CompliancePackController::class, 'updateRequirement']);
        Route::delete('/compliance/requirements/{requirement}', [CompliancePackController::class, 'deleteRequirement']);
        Route::get('/compliance/overview', [CompliancePackController::class, 'overview']);

        // Testimonials (admin)
        Route::get('/testimonials', [TestimonialController::class, 'index']);
        Route::put('/testimonials/{testimonial}', [TestimonialController::class, 'update']);
        Route::put('/testimonials/{testimonial}/toggle-publish', [TestimonialController::class, 'togglePublish']);
        Route::delete('/testimonials/{testimonial}', [TestimonialController::class, 'destroy']);

        // Profile Import Stats & State Sources
        Route::get('/profiles/list', [ProfileClaimController::class, 'adminList']);
        Route::get('/profiles/stats', [ProfileClaimController::class, 'stats']);
        Route::get('/profiles/sources', [ProfileClaimController::class, 'sources']);

        // Rate Table Management
        Route::get('/rate-tables/carriers', [AdminRateTableController::class, 'carriers']);
        Route::get('/rate-tables', [AdminRateTableController::class, 'index']);
        Route::post('/rate-tables', [AdminRateTableController::class, 'store']);
        Route::get('/rate-tables/{rateTable}', [AdminRateTableController::class, 'show']);
        Route::put('/rate-tables/{rateTable}', [AdminRateTableController::class, 'update']);
        Route::delete('/rate-tables/{rateTable}', [AdminRateTableController::class, 'destroy']);
        Route::put('/rate-tables/{rateTable}/toggle-status', [AdminRateTableController::class, 'toggleStatus']);
        Route::post('/rate-tables/{rateTable}/clone', [AdminRateTableController::class, 'cloneTable']);
        Route::post('/rate-tables/{rateTable}/import-csv', [AdminRateTableController::class, 'importCsv']);
        // Rate Table sub-resources
        Route::post('/rate-tables/{rateTable}/entries', [AdminRateTableController::class, 'storeEntry']);
        Route::put('/rate-tables/{rateTable}/entries/{entry}', [AdminRateTableController::class, 'updateEntry']);
        Route::delete('/rate-tables/{rateTable}/entries/{entry}', [AdminRateTableController::class, 'destroyEntry']);
        Route::post('/rate-tables/{rateTable}/factors', [AdminRateTableController::class, 'storeFactor']);
        Route::put('/rate-tables/{rateTable}/factors/{factor}', [AdminRateTableController::class, 'updateFactor']);
        Route::delete('/rate-tables/{rateTable}/factors/{factor}', [AdminRateTableController::class, 'destroyFactor']);
        Route::post('/rate-tables/{rateTable}/riders', [AdminRateTableController::class, 'storeRider']);
        Route::put('/rate-tables/{rateTable}/riders/{rider}', [AdminRateTableController::class, 'updateRider']);
        Route::delete('/rate-tables/{rateTable}/riders/{rider}', [AdminRateTableController::class, 'destroyRider']);
        Route::post('/rate-tables/{rateTable}/fees', [AdminRateTableController::class, 'storeFee']);
        Route::put('/rate-tables/{rateTable}/fees/{fee}', [AdminRateTableController::class, 'updateFee']);
        Route::delete('/rate-tables/{rateTable}/fees/{fee}', [AdminRateTableController::class, 'destroyFee']);
    });

    // Lead Marketplace
    Route::prefix('lead-marketplace')->group(function () {
        Route::get('/browse', [LeadMarketplaceController::class, 'browse']);
        Route::get('/listings/{listing}', [LeadMarketplaceController::class, 'show']);
        Route::post('/listings/{listing}/purchase', [LeadMarketplaceController::class, 'purchase']);
        Route::get('/my-listings', [LeadMarketplaceController::class, 'myListings']);
        Route::post('/listings', [LeadMarketplaceController::class, 'createListing']);
        Route::post('/listings/{listing}/withdraw', [LeadMarketplaceController::class, 'withdraw']);
        Route::get('/stats', [LeadMarketplaceController::class, 'stats']);
        Route::get('/transactions', [LeadMarketplaceController::class, 'transactions']);
        Route::post('/listings/{listing}/bid', [LeadMarketplaceController::class, 'placeBid']);
        Route::post('/listings/{listing}/checkout', [LeadMarketplaceController::class, 'createCheckoutForLead']);
        Route::post('/listings/{listing}/pay-intent', [LeadMarketplaceController::class, 'createPaymentIntent']);
        Route::get('/suggest-price', [LeadMarketplaceController::class, 'suggestPrice']);
        Route::post('/bulk-list', [LeadMarketplaceController::class, 'bulkList']);
    });

    // Testimonials (authenticated - submit feedback)
    Route::post('/testimonials', [TestimonialController::class, 'store']);

    // Agency Settings (agency_owner)
    Route::prefix('agency/settings')->group(function () {
        Route::get('/', [AgencySettingController::class, 'index']);
        Route::put('/', [AgencySettingController::class, 'update']);
        Route::get('/billing', [AgencySettingController::class, 'billing']);
        Route::get('/compliance', [AgencySettingController::class, 'compliance']);
        Route::get('/team-permissions', [AgencySettingController::class, 'teamPermissions']);
        Route::get('/team', [AgencySettingController::class, 'team']);
        Route::post('/agents', [AgencySettingController::class, 'createAgent']);
        Route::post('/agents/{agent}/reset-password', [AgencySettingController::class, 'resetAgentPassword']);
        Route::post('/agents/{agent}/toggle-status', [AgencySettingController::class, 'toggleAgentStatus']);
        Route::delete('/invites/{invite}', [AgencySettingController::class, 'cancelInvite']);
        Route::post('/regenerate-code', [AgencySettingController::class, 'regenerateCode']);
        Route::get('/lead-intake', [AgencySettingController::class, 'leadIntakeInfo']);
    });
});
