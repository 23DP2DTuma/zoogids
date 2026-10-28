<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ReviewRequest;
use App\Models\Product;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class ReviewController extends Controller
{
    /** Lietotāja atsauksmes (profila cilne). */
    public function mine(Request $request)
    {
        return Review::with('product:id,name,image')
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get();
    }

    /** Atsauksme tikai par iegādātu (piegādātu) produktu, viena no lietotāja. */
    public function store(ReviewRequest $request, Product $product)
    {
        $user = $request->user();

        if (! Review::canReview($user, $product->id)) {
            throw ValidationException::withMessages(['rating' => __('messages.review_not_allowed')]);
        }
        if (Review::where('user_id', $user->id)->where('product_id', $product->id)->exists()) {
            throw ValidationException::withMessages(['rating' => __('messages.review_exists')]);
        }

        $review = new Review($request->validated());
        $review->user()->associate($user);
        $review->product()->associate($product);
        $review->save();

        return response()->json($review, 201);
    }

    public function update(ReviewRequest $request, Review $review)
    {
        Gate::authorize('update', $review);
        $review->update($request->validated());

        return $review;
    }

    public function destroy(Review $review)
    {
        Gate::authorize('delete', $review);
        $review->delete();

        return response()->noContent();
    }
}
