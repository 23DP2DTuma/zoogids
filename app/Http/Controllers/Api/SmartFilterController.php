<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SmartFilterRequest;
use App\Services\SmartFilter\SmartFilter;

/** "Gudrais filtrs" — loģika ir servisā App\Services\SmartFilter (atslēgvārdi vai MI modelis). */
class SmartFilterController extends Controller
{
    public function __invoke(SmartFilterRequest $request, SmartFilter $filter)
    {
        return $filter->analyze($request->validated('text'), $request->validated('species'));
    }
}
