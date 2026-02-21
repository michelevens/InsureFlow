<?php

return [

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'anthropic' => [
        'api_key' => env('ANTHROPIC_API_KEY'),
        'model' => env('ANTHROPIC_MODEL', 'claude-sonnet-4-20250514'),
    ],

    'stripe' => [
        'secret' => env('STRIPE_SECRET_KEY'),
        'publishable' => env('STRIPE_PUBLISHABLE_KEY'),
        'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
        'platform_fee_percent' => (float) env('STRIPE_PLATFORM_FEE_PERCENT', 5),
    ],

];
