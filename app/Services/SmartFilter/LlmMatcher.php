<?php

namespace App\Services\SmartFilter;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * MI draiveris: OpenAI-saderīgs /chat/completions API (Laravel Http klients, bez papildu pakotnēm).
 * Modelis saņem problēmu sarakstu un atgriež JSON ar atbilstošo problēmu ID.
 */
class LlmMatcher implements ProblemMatcher
{
    public function __construct(
        private readonly string $apiKey,
        private readonly string $url,
        private readonly string $model,
    ) {}

    public function match(string $text, Collection $problems): array
    {
        $list = $problems->map(fn ($p) => "{$p->id}: {$p->name}")->implode("\n");

        $response = Http::withToken($this->apiKey)
            ->timeout(8)
            ->acceptJson()
            ->post($this->url, [
                'model' => $this->model,
                'temperature' => 0,
                'response_format' => ['type' => 'json_object'],
                'messages' => [
                    ['role' => 'system', 'content' => 'You map a pet owner\'s problem description (Latvian, Russian or English) to known problem categories. '
                        .'Reply only with JSON: {"problem_ids": [ids ordered by relevance]}. Use only ids from the list; return an empty array if nothing fits.'],
                    ['role' => 'user', 'content' => "Problems:\n{$list}\n\nDescription: {$text}"],
                ],
            ])
            ->throw();

        $content = $response->json('choices.0.message.content');
        $decoded = is_string($content) ? json_decode($content, true) : null;

        if (! is_array($decoded) || ! isset($decoded['problem_ids']) || ! is_array($decoded['problem_ids'])) {
            throw new RuntimeException('Invalid LLM response');
        }

        $known = $problems->pluck('id')->all();

        return array_values(array_unique(array_filter(array_map('intval', $decoded['problem_ids']), fn ($id) => in_array($id, $known, true))));
    }
}
