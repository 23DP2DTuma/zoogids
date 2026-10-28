<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Product extends Model
{
    protected $fillable = [
        'category_id', 'brand_id', 'name', 'description', 'price', 'stock', 'species',
        'age_group', 'package_weight', 'kcal_per_100g', 'ingredients', 'image', 'rating',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'rating' => 'float',
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
}
