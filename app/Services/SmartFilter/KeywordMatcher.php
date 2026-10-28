<?php

namespace App\Services\SmartFilter;

use App\Models\Problem;
use Illuminate\Support\Collection;

/** Noklusējuma draiveris: atslēgvārdu sakritība (problems.keywords, lv / ru / en). */
class KeywordMatcher implements ProblemMatcher
{
    public function match(string $text, Collection $problems): array
    {
        $text = mb_strtolower($text);

        return $problems
            ->map(fn (Problem $p) => [
                'id' => $p->id,
                'score' => collect($p->keywordList())->filter(fn ($k) => str_contains($text, $k))->count(),
            ])
            ->filter(fn ($row) => $row['score'] > 0)
            ->sortByDesc('score')
            ->pluck('id')
            ->values()
            ->all();
    }
}
