<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ProblemRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'keywords' => ['required', 'string', 'max:2000'],
            'advice' => ['nullable', 'string', 'max:2000'],
            'products' => ['nullable', 'array'],
            'products.*' => ['integer', 'distinct', 'exists:products,id'],
        ];
    }
}
