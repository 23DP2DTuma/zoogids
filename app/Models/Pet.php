<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Pet extends Model
{
    public const SPECIES = ['suns', 'kaķis', 'grauzējs', 'putns'];

    public const ACTIVITY = ['low', 'normal', 'high'];

    protected $fillable = ['name', 'species', 'breed', 'birth_date', 'weight', 'allergies', 'activity'];

    protected $casts = [
        'birth_date' => 'date:Y-m-d',
        'weight' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reminders(): HasMany
    {
        return $this->hasMany(Reminder::class)->orderBy('date');
    }
}
