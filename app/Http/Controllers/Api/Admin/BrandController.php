<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BrandRequest;
use App\Models\Brand;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class BrandController extends Controller
{
    public function index(Request $request)
    {
        $q = $request->validate(['q' => 'nullable|string|max:100'])['q'] ?? null;

        return Brand::withCount('products')
            ->when($q, fn ($query, $v) => $query->where('name', 'like', "%{$v}%"))
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString();
    }

    public function store(BrandRequest $request)
    {
        return response()->json(Brand::create($request->validated()), 201);
    }

    public function update(BrandRequest $request, Brand $brand)
    {
        $brand->update($request->validated());

        return $brand;
    }

    public function destroy(Brand $brand)
    {
        if ($brand->products()->exists()) {
            throw ValidationException::withMessages(['brand' => __('messages.brand_has_products')]);
        }
        $brand->delete();

        return response()->noContent();
    }
}
