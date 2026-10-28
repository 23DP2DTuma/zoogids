<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Review extends Model
{
    /** Atsauksmi drīkst atstāt, ja lietotājam ir pasūtījums ar šo produktu šajā statusā. */
    public const REQUIRED_ORDER_STATUS = 'piegādāts';

    protected $fillable = ['rating', 'comment'];

    protected $casts = [
        'rating' => 'integer',
        'is_visible' => 'boolean',
    ];

    protected static function booted(): void
    {
        // products.rating = redzamo atsauksmju vidējais vērtējums
        static::saved(fn (Review $r) => Product::recalculateRating($r->product_id));
        static::deleted(fn (Review $r) => Product::recalculateRating($r->product_id));
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public static function canReview(User $user, int $productId): bool
    {
        return $user->orders()
            ->where('status', self::REQUIRED_ORDER_STATUS)
            ->whereHas('items', fn ($q) => $q->where('product_id', $productId))
            ->exists();
    }
}
