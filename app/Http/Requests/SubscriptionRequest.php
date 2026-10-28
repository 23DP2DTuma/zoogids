<?php

namespace App\Http\Requests;

use App\Models\Subscription;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Abonementa maiņa: daudzums, intervāls, statuss (apturēt / atsākt / atcelt). */
class SubscriptionRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'quantity' => ['sometimes', 'required', 'integer', 'min:1', 'max:999'],
            'interval_days' => ['sometimes', 'required', 'integer', 'min:7', 'max:90'],
            'status' => ['sometimes', 'required', Rule::in(Subscription::STATUSES)],
        ];
    }
}
