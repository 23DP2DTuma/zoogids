<?php

namespace App\Http\Requests\Admin;

use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ArticleRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'excerpt' => ['required', 'string', 'max:300'],
            'content' => ['required', 'string', 'max:20000'],
            'species' => ['required', Rule::in(Product::SPECIES)],
            'published_at' => ['required', 'date'],
        ];
    }
}
