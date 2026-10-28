<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UserRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $data = $request->validate(['q' => 'nullable|string|max:100', 'role' => 'nullable|in:user,admin']);

        return User::withCount(['orders', 'pets'])
            ->when($data['q'] ?? null, fn ($query, $v) => $query->where(fn ($w) => $w->where('name', 'like', "%{$v}%")->orWhere('last_name', 'like', "%{$v}%")->orWhere('email', 'like', "%{$v}%")))
            ->when($data['role'] ?? null, fn ($query, $v) => $query->where('role', $v))
            ->orderBy('id')
            ->paginate(10)
            ->withQueryString();
    }

    public function store(UserRequest $request)
    {
        $user = User::create($request->safe()->except('role'));
        $user->forceFill(['role' => $request->validated('role')])->save();

        return response()->json($user, 201);
    }

    public function update(UserRequest $request, User $user)
    {
        // Administrators nevar sev noņemt administratora lomu
        if ($user->is($request->user()) && $request->validated('role') !== 'admin') {
            throw ValidationException::withMessages(['role' => __('messages.cannot_demote_self')]);
        }

        $data = $request->safe()->except(['role', 'password']);
        if ($request->filled('password')) {
            $data['password'] = $request->validated('password');
        }
        $user->fill($data)->forceFill(['role' => $request->validated('role')])->save();

        return $user;
    }

    public function destroy(Request $request, User $user)
    {
        if ($user->is($request->user())) {
            throw ValidationException::withMessages(['user' => __('messages.cannot_delete_self')]);
        }
        DB::transaction(fn () => $user->deleteAccount());

        return response()->noContent();
    }
}
