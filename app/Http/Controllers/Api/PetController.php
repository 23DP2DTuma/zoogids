<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PetRequest;
use App\Models\Pet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class PetController extends Controller
{
    public function index(Request $request)
    {
        return $request->user()->pets()->with('reminders')->orderBy('name')->get();
    }

    public function store(PetRequest $request)
    {
        $pet = $request->user()->pets()->create([...$request->validated(), 'activity' => $request->validated('activity') ?? 'normal']);

        return response()->json($pet->load('reminders'), 201);
    }

    public function show(Pet $pet)
    {
        Gate::authorize('view', $pet);

        return $pet->load('reminders');
    }

    public function update(PetRequest $request, Pet $pet)
    {
        Gate::authorize('update', $pet);
        $pet->update([...$request->validated(), 'activity' => $request->validated('activity') ?? 'normal']);

        return $pet->load('reminders');
    }

    public function destroy(Pet $pet)
    {
        Gate::authorize('delete', $pet);
        $pet->delete();

        return response()->noContent();
    }
}
