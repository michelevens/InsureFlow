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
use App\Http\Controllers\PayoutController;
use App\Http\Controllers\SubscriptionController;
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

    // CRM - Leads
    Route::get('/crm/leads', [LeadController::class, 'index']);
    Route::post('/crm/leads', [LeadController::class, 'store']);
    Route::get('/crm/leads/{lead}', [LeadController::class, 'show']);
    Route::put('/crm/leads/{lead}', [LeadController::class, 'update']);
    Route::post('/crm/leads/{lead}/activity', [LeadController::class, 'addActivity']);

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

    // Agency invites (agency owners invite agents)
    Route::get('/agency/invites', [InviteController::class, 'agencyInvites']);
    Route::post('/agency/invites', [InviteController::class, 'agencyInvite']);

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

        // Invites (admin invites agents/agency_owners/carriers)
        Route::get('/invites', [InviteController::class, 'adminListInvites']);
        Route::post('/invites', [InviteController::class, 'adminInvite']);
    });
});
