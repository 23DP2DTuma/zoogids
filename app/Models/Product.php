<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    public const SPECIES = ['suns', 'kaķis', 'grauzējs', 'putns'];

    public const AGE_GROUPS = ['jauns', 'pieaugušais', 'seniors', 'visi'];

    // rating netiek aizpildīts no formas — to aprēķina no atsauksmēm
    protected $fillable = [
        'category_id', 'brand_id', 'name', 'description', 'price', 'stock', 'species',
        'age_group', 'package_weight', 'kcal_per_100g', 'ingredients', 'image',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'rating' => 'float',
        'stock' => 'integer',
        'package_weight' => 'integer',
        'kcal_per_100g' => 'integer',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function problems(): BelongsToMany
    {
        return $this->belongsToMany(Problem::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /** Pārrēķina vidējo vērtējumu no redzamajām atsauksmēm (0, ja nav). */
    public static function recalculateRating(int ...$ids): void
    {
        foreach (array_unique($ids) as $id) {
            $avg = Review::where('product_id', $id)->where('is_visible', true)->avg('rating');
            static::whereKey($id)->update(['rating' => round((float) $avg, 1)]);
        }
    }
}
