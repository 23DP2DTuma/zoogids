<?php

namespace App\Http\Requests;

use App\Models\Reminder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReminderRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'type' => ['required', Rule::in(Reminder::TYPES)],
            'date' => ['required', 'date'],
            'description' => ['nullable', 'string', 'max:255'],
        ];
    }
}
