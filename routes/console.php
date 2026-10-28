<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Abonementu piegādes katru dienu (php artisan schedule:work lokāli vai cron ar schedule:run)
Schedule::command('subscriptions:process')->dailyAt('06:00');
