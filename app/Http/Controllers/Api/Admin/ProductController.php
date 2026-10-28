<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ProductRequest;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $data = $request->validate([
            'q' => 'nullable|string|max:100',
            'category' => 'nullable|integer',
            'species' => 'nullable|string|max:20',
        ]);

        return Product::with(['category:id,name,icon', 'brand:id,name', 'problems:id,name'])
            ->when($data['q'] ?? null, fn ($q, $v) => $q->where('name', 'like', "%{$v}%"))
            ->when($data['category'] ?? null, fn ($q, $v) => $q->where('category_id', $v))
            ->when($data['species'] ?? null, fn ($q, $v) => $q->where('species', $v))
            ->orderByDesc('id')
            ->paginate(10)
            ->withQueryString();
    }

    public function store(ProductRequest $request)
    {
        $product = new Product;
        $this->fill($product, $request);

        return response()->json($product->load(['category', 'brand', 'problems']), 201);
    }

    public function update(ProductRequest $request, Product $product)
    {
        $this->fill($product, $request);

        return $product->load(['category', 'brand', 'problems']);
    }

    /** Produktu, kas ir pasūtījumos, dzēst nedrīkst (pasūtījumu vēsture). */
    public function destroy(Product $product)
    {
        if ($product->orderItems()->exists()) {
            throw ValidationException::withMessages(['product' => __('messages.product_in_orders')]);
        }
        $this->deleteImage($product->image);
        $product->delete();

        return response()->noContent();
    }

    private function fill(Product $product, ProductRequest $request): void
    {
        $data = collect($request->validated())->except(['image_file', 'remove_image', 'problems'])->all();
        $data['age_group'] ??= 'visi';

        // Attēls: augšupielādēts fails uz "public" diska (storage/app/public/products) vai emoji
        $image = match (true) {
            $request->hasFile('image_file') => $request->file('image_file')->store('products', 'public'),
            $request->boolean('remove_image') => null,
            default => $data['image'] ?? null,
        };
        if ($product->exists && $product->image !== $image) {
            $this->deleteImage($product->image);
        }
        $data['image'] = $image;

        $product->fill($data)->save();
        $product->problems()->sync($request->validated('problems') ?? []);
    }

    private function deleteImage(?string $image): void
    {
        if ($image && str_starts_with($image, 'products/')) {
            Storage::disk('public')->delete($image);
        }
    }
}
