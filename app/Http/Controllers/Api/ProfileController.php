<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\DeleteAccountRequest;
use App\Http\Requests\Auth\UpdatePasswordRequest;
use App\Http\Requests\Auth\UpdateProfileRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        return $request->user();
    }

    public function update(UpdateProfileRequest $request)
    {
        $request->user()->update($request->validated());

        return $request->user();
    }

    public function password(UpdatePasswordRequest $request)
    {
        $request->user()->update(['password' => $request->validated('password')]);

        return response()->json(['message' => __('messages.password_changed')]);
    }

    /**
     * Konta dzēšana: mīluļi, grozs, abonementi un atsauksmes tiek dzēsti (FK cascade),
     * pasūtījumi paliek vēsturē ar user_id = null.
     */
    public function destroy(DeleteAccountRequest $request)
    {
        $user = $request->user();

        Auth::guard('web')->logout();
        DB::transaction(fn () => $user->delete());

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->noContent();
    }
}
