<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reminder extends Model
{
    public const TYPES = ['vakcinācija', 'pretparazītu', 'vizīte'];

    protected $fillable = ['type', 'date', 'description'];

    protected $casts = ['date' => 'date:Y-m-d'];

    public function pet(): BelongsTo
    {
        return $this->belongsTo(Pet::class);
    }
}
