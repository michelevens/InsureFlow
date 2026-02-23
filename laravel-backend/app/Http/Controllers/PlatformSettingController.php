<?php

namespace App\Http\Controllers;

use App\Models\PlatformSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Cache;

class PlatformSettingController extends Controller
{
    /**
     * Get all platform settings grouped by category.
     */
    public function index()
    {
        $settings = PlatformSetting::all()->groupBy('group')->map(function ($items) {
            return $items->pluck('value', 'key');
        });

        return response()->json($settings);
    }

    /**
     * Update platform settings (bulk key-value update).
     */
    public function update(Request $request)
    {
        $data = $request->validate([
            'settings' => 'required|array',
            'settings.*.key' => 'required|string',
            'settings.*.value' => 'present',
            'settings.*.group' => 'required|string|in:platform,billing,email,security,notifications,integrations',
        ]);

        foreach ($data['settings'] as $item) {
            PlatformSetting::setValue($item['key'], $item['value'], $item['group']);
        }

        return response()->json(['message' => 'Settings updated successfully']);
    }

    /**
     * Send a test email to verify email configuration.
     */
    public function testEmail(Request $request)
    {
        $data = $request->validate([
            'to' => 'required|email',
        ]);

        try {
            Mail::raw('This is a test email from InsureFlow platform settings.', function ($message) use ($data) {
                $message->to($data['to'])
                        ->subject('InsureFlow — Test Email');
            });

            return response()->json(['message' => 'Test email sent successfully']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to send test email: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Test Stripe connection.
     */
    public function testStripe()
    {
        try {
            $key = config('services.stripe.secret');
            if (!$key) {
                return response()->json([
                    'connected' => false,
                    'message' => 'Stripe secret key is not configured',
                ]);
            }

            $stripe = new \Stripe\StripeClient($key);
            $account = $stripe->accounts->retrieve('me', []);

            return response()->json([
                'connected' => true,
                'account_id' => $account->id,
                'display_name' => $account->settings->dashboard->display_name ?? null,
                'message' => 'Stripe connection verified',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'connected' => false,
                'message' => 'Stripe connection failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * System health check.
     */
    public function systemHealth()
    {
        $checks = [];

        // Database
        try {
            DB::connection()->getPdo();
            $checks['database'] = ['status' => 'ok', 'message' => 'Connected'];
        } catch (\Exception $e) {
            $checks['database'] = ['status' => 'error', 'message' => $e->getMessage()];
        }

        // Cache
        try {
            Cache::put('health_check', true, 10);
            $checks['cache'] = Cache::get('health_check')
                ? ['status' => 'ok', 'message' => 'Working']
                : ['status' => 'error', 'message' => 'Read failed'];
        } catch (\Exception $e) {
            $checks['cache'] = ['status' => 'error', 'message' => $e->getMessage()];
        }

        // Storage
        try {
            $path = storage_path('framework/health_check.tmp');
            file_put_contents($path, 'ok');
            $checks['storage'] = file_get_contents($path) === 'ok'
                ? ['status' => 'ok', 'message' => 'Writable']
                : ['status' => 'error', 'message' => 'Write verification failed'];
            @unlink($path);
        } catch (\Exception $e) {
            $checks['storage'] = ['status' => 'error', 'message' => $e->getMessage()];
        }

        // Stripe
        $checks['stripe'] = config('services.stripe.secret')
            ? ['status' => 'ok', 'message' => 'Key configured']
            : ['status' => 'warning', 'message' => 'Not configured'];

        // Mail
        $checks['mail'] = config('mail.default') !== 'log'
            ? ['status' => 'ok', 'message' => 'Provider: ' . config('mail.default')]
            : ['status' => 'warning', 'message' => 'Using log driver'];

        $allOk = collect($checks)->every(fn ($c) => $c['status'] === 'ok');

        return response()->json([
            'status' => $allOk ? 'healthy' : 'degraded',
            'checks' => $checks,
            'timestamp' => now()->toIso8601String(),
        ]);
    }
}
