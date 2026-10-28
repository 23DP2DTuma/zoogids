<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Problem extends Model
{
    protected $fillable = ['name', 'keywords', 'advice'];

    protected $hidden = ['keywords', 'pivot'];

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class);
    }

    /** Atslēgvārdu saraksts mazajiem burtiem. */
    public function keywordList(): array
    {
        return array_filter(array_map(fn ($k) => mb_strtolower(trim($k)), explode(',', $this->keywords)));
    }
}
