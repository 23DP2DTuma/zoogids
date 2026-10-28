<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\Request;

/** Atsauksmju moderācija: paslēpt / rādīt / dzēst (vērtējums tiek pārrēķināts modelī). */
class ReviewController extends Controller
{
    public function index(Request $request)
    {
        $data = $request->validate(['q' => 'nullable|string|max:100', 'visible' => 'nullable|in:0,1']);

        return Review::with(['user:id,name,last_name,email', 'product:id,name'])
            ->when(isset($data['visible']), fn ($query) => $query->where('is_visible', (bool) $data['visible']))
            ->when($data['q'] ?? null, fn ($query, $v) => $query->where(fn ($w) => $w->where('comment', 'like', "%{$v}%")->orWhereHas('product', fn ($p) => $p->where('name', 'like', "%{$v}%"))))
            ->latest()
            ->paginate(10)
            ->withQueryString();
    }

    public function update(Request $request, Review $review)
    {
        $data = $request->validate(['is_visible' => 'required|boolean']);
        $review->forceFill(['is_visible' => $data['is_visible']])->save();

        return $review->load(['user:id,name,last_name,email', 'product:id,name']);
    }

    public function destroy(Review $review)
    {
        $review->delete();

        return response()->noContent();
    }
}
