<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ArticleRequest;
use App\Models\Article;
use Illuminate\Http\Request;

class ArticleController extends Controller
{
    public function index(Request $request)
    {
        $data = $request->validate(['q' => 'nullable|string|max:100', 'species' => 'nullable|string|max:20']);

        return Article::when($data['q'] ?? null, fn ($query, $v) => $query->where('title', 'like', "%{$v}%"))
            ->when($data['species'] ?? null, fn ($query, $v) => $query->where('species', $v))
            ->orderByDesc('published_at')
            ->paginate(10)
            ->withQueryString();
    }

    public function store(ArticleRequest $request)
    {
        return response()->json(Article::create($request->validated()), 201);
    }

    public function update(ArticleRequest $request, Article $article)
    {
        $article->update($request->validated());

        return $article;
    }

    public function destroy(Article $article)
    {
        $article->delete();

        return response()->noContent();
    }
}
