<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Article;
use Illuminate\Http\Request;

class ArticleController extends Controller
{
    public function index(Request $request)
    {
        return Article::when($request->query('species'), fn ($q, $v) => $q->where('species', $v))
            ->orderByDesc('published_at')
            ->get();
    }

    public function show(Article $article)
    {
        return $article;
    }
}
