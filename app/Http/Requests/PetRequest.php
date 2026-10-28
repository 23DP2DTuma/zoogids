<?php

namespace App\Http\Requests;

use App\Models\Pet;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PetRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:50'],
            'species' => ['required', Rule::in(Pet::SPECIES)],
            'breed' => ['nullable', 'string', 'max:50'],
            'birth_date' => ['nullable', 'date', 'before_or_equal:today'],
            'weight' => ['required', 'numeric', 'gt:0', 'max:999.99', 'decimal:0,2'],
            'allergies' => ['nullable', 'string', 'max:255'],
            'activity' => ['nullable', Rule::in(Pet::ACTIVITY)],
        ];
    }
}
