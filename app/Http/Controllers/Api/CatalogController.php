<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Problem;
use App\Models\Product;
use Illuminate\Http\Request;

class CatalogController extends Controller
{
    /** Filtru vērtības katalogam. */
    public function meta()
    {
        return [
            'categories' => Category::orderBy('name')->get(),
            'brands' => Brand::orderBy('name')->get(),
            'problems' => Problem::orderBy('name')->get(['id', 'name']),
            'species' => ['suns', 'kaķis', 'grauzējs', 'putns'],
        ];
    }

    /**
     * Produktu saraksts ar filtriem:
     * q, category, brand, species, min_price, max_price, sort (price_asc|price_desc|rating), exclude (alergēni, ar komatu)
     */
    public function index(Request $request)
    {
        $data = $request->validate([
            'q' => 'nullable|string|max:100',
            'category' => 'nullable|integer',
            'brand' => 'nullable|integer',
            'species' => 'nullable|in:suns,kaķis,grauzējs,putns',
            'min_price' => 'nullable|numeric|min:0',
            'max_price' => 'nullable|numeric|min:0',
            'sort' => 'nullable|in:price_asc,price_desc,rating',
            'exclude' => 'nullable|string|max:255',
            'problem' => 'nullable|integer',
            'food' => 'nullable|boolean',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        $query = Product::with(['category', 'brand'])
            ->when($data['q'] ?? null, fn ($q, $v) => $q->where(fn ($w) => $w->where('name', 'like', "%{$v}%")->orWhere('description', 'like', "%{$v}%")))
            ->when($data['food'] ?? null, fn ($q) => $q->whereNotNull('kcal_per_100g'))
            ->when($data['category'] ?? null, fn ($q, $v) => $q->where('category_id', $v))
            ->when($data['brand'] ?? null, fn ($q, $v) => $q->where('brand_id', $v))
            ->when($data['species'] ?? null, fn ($q, $v) => $q->where('species', $v))
            ->when($data['min_price'] ?? null, fn ($q, $v) => $q->where('price', '>=', $v))
            ->when($data['max_price'] ?? null, fn ($q, $v) => $q->where('price', '<=', $v))
            ->when($data['problem'] ?? null, fn ($q, $v) => $q->whereHas('problems', fn ($p) => $p->where('problems.id', $v)));

        // Mīluļa alerģijas: izslēdzam produktus, kuru sastāvā ir alergēns
        foreach (array_filter(array_map('trim', explode(',', $data['exclude'] ?? ''))) as $allergen) {
            $query->where(fn ($q) => $q->whereNull('ingredients')->orWhere('ingredients', 'not like', "%{$allergen}%"));
        }

        match ($data['sort'] ?? null) {
            'price_asc' => $query->orderBy('price'),
            'price_desc' => $query->orderByDesc('price'),
            'rating' => $query->orderByDesc('rating'),
            default => $query->orderBy('id'),
        };

        // Lappušu dalīšana: 12 produkti lapā, React rāda "Ielādēt vēl"
        return $query->paginate($data['per_page'] ?? 12)->withQueryString();
    }

    public function show(Product $product)
    {
        return $product->load(['category', 'brand', 'problems']);
    }
}
