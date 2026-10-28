<?php

namespace App\Http\Requests\Admin;

use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProductRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:1000'],
            'price' => ['required', 'numeric', 'gt:0', 'decimal:0,2', 'max:999999.99'],
            'stock' => ['required', 'integer', 'min:0', 'max:1000000'],
            'species' => ['required', Rule::in(Product::SPECIES)],
            'age_group' => ['nullable', Rule::in(Product::AGE_GROUPS)],
            'package_weight' => ['nullable', 'integer', 'min:1', 'max:1000000'],
            'kcal_per_100g' => ['nullable', 'integer', 'min:1', 'max:2000'],
            'ingredients' => ['nullable', 'string', 'max:255'],
            'image' => ['nullable', 'string', 'max:255'],
            'image_file' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'remove_image' => ['nullable', 'boolean'],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'brand_id' => ['required', 'integer', 'exists:brands,id'],
            'problems' => ['nullable', 'array'],
            'problems.*' => ['integer', 'distinct', 'exists:problems,id'],
        ];
    }
}
