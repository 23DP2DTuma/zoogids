<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Paroles prasības: ≥ 8 simboli, lielie + mazie burti, cipars, speciālais simbols
        Password::defaults(fn () => Password::min(8)->mixedCase()->numbers()->symbols());

        Gate::define('admin', fn (User $user) => $user->isAdmin());

        // Vispārējs API pieprasījumu ierobežojums: 120 minūtē lietotājam / IP
        RateLimiter::for('api', fn (Request $request) => Limit::perMinute(120)->by($request->user()?->id ?: $request->ip()));

        // Pieteikšanās mēģinājumu ierobežojums: 5 minūtē no viena e-pasta + IP
        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(5)->by(mb_strtolower((string) $request->input('email')).'|'.$request->ip());
        });
    }
}
