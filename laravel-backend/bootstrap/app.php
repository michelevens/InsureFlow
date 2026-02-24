<?php

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
    )
    ->withSchedule(function (Schedule $schedule) {
        $schedule->command('leads:check-aging')->hourly();
    })
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'agency.scope' => \App\Http\Middleware\EnsureAgencyScope::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
