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

// Stripe webhook (no auth)
Route::post('/webhooks/stripe', [SubscriptionController::class, 'handleWebhook']);

// Invites (public — for viewing and accepting)
Route::get('/invites/{token}', [InviteController::class, 'show']);
Route::post('/invites/{token}/accept', [InviteController::class, 'accept']);

// SSO (public — SAML login, ACS callback, metadata)
Route::get('/sso/login/{agencySlug}', [SamlController::class, 'login']);
Route::post('/sso/acs/{agencySlug}', [SamlController::class, 'acs']);
Route::get('/sso/metadata', [SamlController::class, 'metadata']);

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

    // Dashboard stats
    Route::get('/stats/dashboard', [AnalyticsController::class, 'dashboard']);

    // Advanced Analytics
    Route::get('/analytics/conversion-funnel', [AnalyticsController::class, 'conversionFunnel']);
    Route::get('/analytics/revenue-trends', [AnalyticsController::class, 'revenueTrends']);
    Route::get('/analytics/agent-performance', [AnalyticsController::class, 'agentPerformance']);
    Route::get('/analytics/claims', [AnalyticsController::class, 'claimsAnalytics']);

    // Quotes
    Route::get('/quotes', [QuoteController::class, 'myQuotes']);
    Route::get('/quotes/{quoteRequest}', [QuoteController::class, 'show']);

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

    // Reference data (product types, suggested coverages)
    Route::get('/insurance/product-types', [LeadScenarioController::class, 'productTypes']);
    Route::get('/insurance/suggested-coverages/{productType}', [LeadScenarioController::class, 'suggestedCoverages']);

    // Commissions
    Route::get('/commissions', [CommissionController::class, 'index']);
    Route::get('/commissions/{commission}', [CommissionController::class, 'show']);

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

    // Subscriptions
    Route::get('/subscriptions/current', [SubscriptionController::class, 'current']);
    Route::post('/subscriptions/checkout', [SubscriptionController::class, 'checkout']);
    Route::post('/subscriptions/cancel', [SubscriptionController::class, 'cancel']);
    Route::post('/subscriptions/resume', [SubscriptionController::class, 'resume']);

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

    // SSO Configuration (admin/agency_owner)
    Route::post('/sso/configure', [SamlController::class, 'configure']);
    Route::post('/sso/disable/{agency}', [SamlController::class, 'disable']);

    // Carrier API Integration
    Route::get('/carrier-api/configs', [CarrierApiController::class, 'index']);
    Route::post('/carrier-api/configs', [CarrierApiController::class, 'store']);
    Route::put('/carrier-api/configs/{config}', [CarrierApiController::class, 'update']);
    Route::delete('/carrier-api/configs/{config}', [CarrierApiController::class, 'destroy']);
    Route::post('/carrier-api/configs/{config}/test', [CarrierApiController::class, 'test']);
    Route::get('/carrier-api/configs/{config}/logs', [CarrierApiController::class, 'logs']);
    Route::post('/carrier-api/live-rates', [CarrierApiController::class, 'getLiveRates']);

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

    /*
    |----------------------------------------------------------------------
    | Admin Routes
    |----------------------------------------------------------------------
    */

    Route::prefix('admin')->group(function () {
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
    });
});
