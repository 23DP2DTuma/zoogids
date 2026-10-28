<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ProblemRequest;
use App\Models\Problem;
use Illuminate\Http\Request;

/** Problēmas ar atslēgvārdiem gudrajam filtram un piesaistītajiem produktiem. */
class ProblemController extends Controller
{
    public function index(Request $request)
    {
        $q = $request->validate(['q' => 'nullable|string|max:100'])['q'] ?? null;

        $page = Problem::with('products:id,name')
            ->when($q, fn ($query, $v) => $query->where(fn ($w) => $w->where('name', 'like', "%{$v}%")->orWhere('keywords', 'like', "%{$v}%")))
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString();

        $page->getCollection()->each->makeVisible('keywords');

        return $page;
    }

    public function store(ProblemRequest $request)
    {
        $problem = Problem::create($request->safe()->except('products'));
        $problem->products()->sync($request->validated('products') ?? []);

        return response()->json($problem->load('products:id,name')->makeVisible('keywords'), 201);
    }

    public function update(ProblemRequest $request, Problem $problem)
    {
        $problem->update($request->safe()->except('products'));
        $problem->products()->sync($request->validated('products') ?? []);

        return $problem->load('products:id,name')->makeVisible('keywords');
    }

    public function destroy(Problem $problem)
    {
        $problem->delete();

        return response()->noContent();
    }
}
