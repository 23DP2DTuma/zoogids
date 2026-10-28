<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CategoryRequest;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $q = $request->validate(['q' => 'nullable|string|max:100'])['q'] ?? null;

        return Category::withCount('products')
            ->when($q, fn ($query, $v) => $query->where('name', 'like', "%{$v}%"))
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString();
    }

    public function store(CategoryRequest $request)
    {
        return response()->json(Category::create($request->validated()), 201);
    }

    public function update(CategoryRequest $request, Category $category)
    {
        $category->update($request->validated());

        return $category;
    }

    public function destroy(Category $category)
    {
        if ($category->products()->exists()) {
            throw ValidationException::withMessages(['category' => __('messages.category_has_products')]);
        }
        $category->delete();

        return response()->noContent();
    }
}
