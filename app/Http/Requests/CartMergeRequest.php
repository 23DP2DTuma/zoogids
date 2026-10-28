<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/** Viesa groza (localStorage) apvienošana ar servera grozu pēc pieteikšanās. */
class CartMergeRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'items' => ['present', 'array', 'max:100'],
            'items.*.product_id' => ['required', 'integer', 'distinct', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:999'],
        ];
    }
}
