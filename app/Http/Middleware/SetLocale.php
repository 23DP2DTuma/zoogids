<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Valoda kļūdu paziņojumiem: SPA sūta galveni X-Locale (lv | en | ru). */
class SetLocale
{
    public const LOCALES = ['lv', 'en', 'ru'];

    public function handle(Request $request, Closure $next): Response
    {
        $locale = $request->header('X-Locale');
        if (in_array($locale, self::LOCALES, true)) {
            app()->setLocale($locale);
        }

        return $next($request);
    }
}
