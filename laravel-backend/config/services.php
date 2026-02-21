<?php

return [

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'stripe' => [
        'secret' => env('STRIPE_SECRET_KEY'),
        'publishable' => env('STRIPE_PUBLISHABLE_KEY'),
        'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
        'platform_fee_percent' => (float) env('STRIPE_PLATFORM_FEE_PERCENT', 5),
    ],

];
