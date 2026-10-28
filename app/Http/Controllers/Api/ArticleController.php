<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Article;
use Illuminate\Http\Request;

class ArticleController extends Controller
{
    public function index(Request $request)
    {
        $data = $request->validate(['species' => 'nullable|in:suns,kaķis,grauzējs,putns']);

        // Publiski redzami tikai jau publicētie raksti
        return Article::whereDate('published_at', '<=', today())
            ->when($data['species'] ?? null, fn ($q, $v) => $q->where('species', $v))
            ->orderByDesc('published_at')
            ->get();
    }

    public function show(Article $article)
    {
        abort_if($article->published_at->isFuture(), 404);

        return $article;
    }
}
