<?php

namespace App\Http\Requests;

use App\Models\Order;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CheckoutRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'delivery_type' => ['required', Rule::in(Order::DELIVERY_TYPES)],
            // Pakomātam — izvēle no statiska saraksta; kurjeram — brīva adrese
            'locker_id' => ['exclude_unless:delivery_type,pakomāts', 'required', Rule::in(array_column(config('lockers'), 'id'))],
            'address' => ['exclude_unless:delivery_type,kurjers', 'required', 'string', 'max:255'],
            'subscribe' => ['nullable', 'boolean'],
            'interval_days' => ['exclude_unless:subscribe,true', 'required', 'integer', 'min:7', 'max:90'],
        ];
    }

    public function messages(): array
    {
        return ['locker_id.in' => __('messages.locker_invalid'), 'locker_id.required' => __('messages.locker_invalid')];
    }

    /** Piegādes adrese, kas tiek saglabāta pasūtījumā. */
    public function deliveryAddress(): string
    {
        if ($this->validated('delivery_type') === 'kurjers') {
            return $this->validated('address');
        }
        $locker = collect(config('lockers'))->firstWhere('id', $this->validated('locker_id'));

        return "{$locker['provider']} pakomāts \"{$locker['name']}\", {$locker['address']}, {$locker['city']}";
    }
}
