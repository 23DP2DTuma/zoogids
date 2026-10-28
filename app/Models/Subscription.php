<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subscription extends Model
{
    public const STATUSES = ['aktīvs', 'apturēts', 'atcelts'];

    public const DISCOUNT = 0.10; // −10 % abonementa precēm

    protected $fillable = ['user_id', 'product_id', 'quantity', 'interval_days', 'next_delivery_date', 'delivery_type', 'address', 'status'];

    protected $casts = [
        'next_delivery_date' => 'date:Y-m-d',
        'quantity' => 'integer',
        'interval_days' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }
}
