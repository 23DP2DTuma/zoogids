<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    /** Pasūtījuma statusi secībā: jauns → apstrādē → nosūtīts → piegādāts (vai atcelts). */
    public const STATUSES = ['jauns', 'apstrādē', 'nosūtīts', 'piegādāts', 'atcelts'];

    public const DELIVERY_TYPES = ['pakomāts', 'kurjers'];

    public const FREE_DELIVERY_FROM = 35;

    public const DELIVERY_FEES = ['pakomāts' => 2.99, 'kurjers' => 5.99];

    // customer_name un email — momentuzņēmums pasūtīšanas brīdī
    protected $fillable = [
        'user_id', 'subscription_id', 'customer_name', 'email', 'delivery_type', 'address',
        'delivery_fee', 'discount', 'total', 'status', 'paid_at',
    ];

    protected $casts = [
        'total' => 'decimal:2',
        'delivery_fee' => 'decimal:2',
        'discount' => 'decimal:2',
        'paid_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /** Piegādes maksa: bezmaksas no 35 €, citādi pakomāts 2,99 € / kurjers 5,99 €. */
    public static function deliveryFee(float $goods, string $type): float
    {
        return $goods >= self::FREE_DELIVERY_FROM ? 0.0 : self::DELIVERY_FEES[$type];
    }
}
