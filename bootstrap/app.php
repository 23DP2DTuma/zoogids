<?php

use App\Http\Middleware\EnsureUserIsAdmin;
use App\Http\Middleware\SetLocale;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Sanctum SPA autentifikācija ar sesijas sīkdatni + CSRF
        $middleware->statefulApi();
        $middleware->api(prepend: [SetLocale::class]);
        $middleware->alias(['admin' => EnsureUserIsAdmin::class]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        // Cilvēkam saprotami (lokalizēti) kļūdu teksti API atbildēs
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => __('messages.unauthenticated')], 401);
            }
        });
        // 403 (politikas, admin starpprogrammatūra) un 404 (modelis nav atrasts)
        $exceptions->render(function (HttpException $e, Request $request) {
            if ($request->is('api/*') && in_array($e->getStatusCode(), [403, 404], true)) {
                $key = $e->getStatusCode() === 403 ? 'messages.forbidden' : 'messages.not_found';

                return response()->json(['message' => __($key)], $e->getStatusCode());
            }
        });
        $exceptions->render(function (ThrottleRequestsException $e, Request $request) {
            if ($request->is('api/*')) {
                $seconds = (int) ($e->getHeaders()['Retry-After'] ?? 60);

                return response()->json(['message' => __('auth.throttle', ['seconds' => $seconds])], 429, $e->getHeaders());
            }
        });
    })->create();
