<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Article extends Model
{
    protected $fillable = ['title', 'excerpt', 'content', 'species', 'published_at'];

    protected $casts = ['published_at' => 'date:Y-m-d'];
}
