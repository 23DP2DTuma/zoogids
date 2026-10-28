<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Problem;
use Illuminate\Http\Request;

/**
 * "Gudrais filtrs" — prototipā darbojas ar atslēgvārdu sakritību.
 * Īstajā sistēmā šeit tiktu izsaukts MI valodas modeļa API, kas teksts → problēmas.
 */
class SmartFilterController extends Controller
{
    public function __invoke(Request $request)
    {
        $data = $request->validate([
            'text' => 'required|string|max:300',
            'species' => 'nullable|in:suns,kaķis,grauzējs,putns',
        ], [
            'text.required' => 'Lūdzu, aprakstiet problēmu.',
            'text.max' => 'Apraksts nedrīkst būt garāks par 300 simboliem.',
        ]);

        $text = mb_strtolower($data['text']);
        $species = $data['species'] ?? $this->guessSpecies($text);

        $matched = Problem::all()
            ->map(function (Problem $p) use ($text) {
                $hits = collect($p->keywordList())->filter(fn ($k) => str_contains($text, $k))->count();
                $p->score = $hits;

                return $p;
            })
            ->filter(fn ($p) => $p->score > 0)
            ->sortByDesc('score')
            ->values();

        $products = $matched->isEmpty() ? collect() : \App\Models\Product::with(['brand', 'category'])
            ->whereHas('problems', fn ($q) => $q->whereIn('problems.id', $matched->pluck('id')))
            ->when($species, fn ($q, $v) => $q->where('species', $v))
            ->orderByDesc('rating')
            ->get();

        return [
            'species' => $species,
            'problems' => $matched->map->only(['id', 'name', 'advice']),
            'products' => $products,
        ];
    }

    private function guessSpecies(string $text): ?string
    {
        $map = [
            'suns' => ['suns', 'suņ', 'kucēn', 'собак', 'щен', 'пёс', 'пес', 'dog', 'puppy'],
            'kaķis' => ['kaķ', 'кот', 'кош', 'cat', 'kitten'],
            'grauzējs' => ['trusi', 'kāmj', 'jūrascūc', 'хомяк', 'кролик', 'rabbit', 'hamster'],
            'putns' => ['papagai', 'putn', 'попуга', 'птиц', 'parrot', 'bird'],
        ];
        foreach ($map as $species => $words) {
            foreach ($words as $w) {
                if (str_contains($text, $w)) {
                    return $species;
                }
            }
        }

        return null;
    }
}
