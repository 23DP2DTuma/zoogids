<?php

namespace App\Http\Requests\Admin;

use App\Models\Order;
use App\Models\Subscription;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Pasūtījuma vai abonementa statusa maiņa (administrators). */
class StatusRequest extends FormRequest
{
    public function rules(): array
    {
        $statuses = $this->route('subscription') ? Subscription::STATUSES : Order::STATUSES;

        return [
            'status' => ['required', Rule::in($statuses)],
        ];
    }
}
