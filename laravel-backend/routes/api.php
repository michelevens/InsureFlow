<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AgentController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\ApplicationController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CarrierController;
use App\Http\Controllers\CommissionController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\PolicyController;
use App\Http\Controllers\QuoteController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

// Auth
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// Calculator / Quote
Route::post('/calculator/estimate', [QuoteController::class, 'estimate']);

// Marketplace (public)
Route::get('/marketplace/agents', [AgentController::class, 'index']);
Route::get('/marketplace/agents/{id}', [AgentController::class, 'show']);

// Carriers (public)
Route::get('/carriers', [CarrierController::class, 'index']);
Route::get('/carriers/{carrier}', [CarrierController::class, 'show']);

/*
|--------------------------------------------------------------------------
| Protected Routes (auth:sanctum)
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);
    Route::put('/auth/password', [AuthController::class, 'changePassword']);

    // Dashboard stats
    Route::get('/stats/dashboard', [AnalyticsController::class, 'dashboard']);

    // Quotes
    Route::get('/quotes', [QuoteController::class, 'myQuotes']);
    Route::get('/quotes/{quoteRequest}', [QuoteController::class, 'show']);

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

    /*
    |----------------------------------------------------------------------
    | Admin Routes
    |----------------------------------------------------------------------
    */

    Route::prefix('admin')->middleware('auth:sanctum')->group(function () {
        // Users
        Route::get('/users', [AdminController::class, 'users']);
        Route::get('/users/{user}', [AdminController::class, 'showUser']);
        Route::put('/users/{user}', [AdminController::class, 'updateUser']);

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
    });
});
