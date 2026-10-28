<?php

namespace App\Services\SmartFilter;

use Illuminate\Support\Collection;

/** Teksts → atbilstošo problēmu ID (sakārtoti pēc atbilstības). */
interface ProblemMatcher
{
    /**
     * @param  Collection<int, \App\Models\Problem>  $problems
     * @return array<int, int>
     */
    public function match(string $text, Collection $problems): array;
}
