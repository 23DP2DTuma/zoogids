<?php

namespace App\Http\Requests\Admin;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UserRequest extends FormRequest
{
    public function rules(): array
    {
        $editing = $this->route('user') !== null;

        return [
            'name' => ['required', 'string', 'max:30'],
            'last_name' => ['required', 'string', 'max:30'],
            'email' => ['required', 'string', 'email', 'max:50', Rule::unique('users', 'email')->ignore($this->route('user'))],
            // Rediģējot parole nav obligāta (tukša — netiek mainīta)
            'password' => [$editing ? 'nullable' : 'required', 'confirmed', Password::defaults()],
            'role' => ['required', Rule::in(User::ROLES)],
        ];
    }
}
