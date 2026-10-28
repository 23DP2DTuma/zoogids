<?php

namespace App\Services\SmartFilter;

use App\Models\Problem;
use App\Models\Product;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * "Gudrais filtrs": problēmas apraksts → problēmas + ieteiktie produkti.
 * Draiveris no .env: SMART_FILTER_DRIVER=keywords|llm. Jebkuras LLM kļūdas vai trūkstošas
 * atslēgas gadījumā tiek izmantots atslēgvārdu draiveris.
 */
class SmartFilter
{
    public function __construct(private readonly KeywordMatcher $keywords) {}

    public function analyze(string $text, ?string $species = null): array
    {
        $problems = Problem::all();
        [$ids, $driver] = $this->matchProblems($text, $problems);

        $species ??= $this->guessSpecies(mb_strtolower($text));
        $matched = $problems->whereIn('id', $ids)->sortBy(fn ($p) => array_search($p->id, $ids))->values();

        $products = $matched->isEmpty() ? collect() : Product::with(['brand', 'category'])
            ->whereHas('problems', fn ($q) => $q->whereIn('problems.id', $ids))
            ->when($species, fn ($q, $v) => $q->where('species', $v))
            ->orderByDesc('rating')
            ->get();

        return [
            'driver' => $driver,
            'species' => $species,
            'problems' => $matched->map->only(['id', 'name', 'advice'])->values(),
            'products' => $products,
        ];
    }

    /** @return array{0: array<int, int>, 1: string} */
    private function matchProblems(string $text, $problems): array
    {
        $config = config('services.smart_filter');

        if (($config['driver'] ?? 'keywords') === 'llm' && ! empty($config['llm']['key'])) {
            try {
                $llm = new LlmMatcher($config['llm']['key'], $config['llm']['url'], $config['llm']['model']);

                return [$llm->match($text, $problems), 'llm'];
            } catch (Throwable $e) {
                Log::warning('SmartFilter LLM kļūda, izmantoju atslēgvārdus: '.$e->getMessage());
            }
        }

        return [$this->keywords->match($text, $problems), 'keywords'];
    }

    private function guessSpecies(string $text): ?string
    {
        $map = [
            'suns' => ['suns', 'suņ', 'kucēn', 'собак', 'щен', 'пёс', 'пес', 'dog', 'puppy'],
            'kaķis' => ['kaķ', 'кот', 'кош', 'cat', 'kitten'],
            'grauzējs' => ['trusi', 'trus', 'kāmj', 'jūrascūc', 'хомяк', 'кролик', 'rabbit', 'hamster'],
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
