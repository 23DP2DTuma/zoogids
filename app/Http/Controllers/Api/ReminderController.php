<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ReminderRequest;
use App\Models\Pet;
use App\Models\Reminder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ReminderController extends Controller
{
    /** Tuvāko 30 dienu vakcinācijas / pretparazītu / vizīšu datumi visiem lietotāja mīluļiem. */
    public function upcoming(Request $request)
    {
        return Reminder::with('pet:id,name,species')
            ->whereHas('pet', fn ($q) => $q->where('user_id', $request->user()->id))
            ->whereBetween('date', [today()->toDateString(), today()->addDays(30)->toDateString()])
            ->orderBy('date')
            ->get();
    }

    public function store(ReminderRequest $request, Pet $pet)
    {
        Gate::authorize('update', $pet);

        return response()->json($pet->reminders()->create($request->validated()), 201);
    }

    public function update(ReminderRequest $request, Reminder $reminder)
    {
        Gate::authorize('update', $reminder);
        $reminder->update($request->validated());

        return $reminder;
    }

    public function destroy(Reminder $reminder)
    {
        Gate::authorize('delete', $reminder);
        $reminder->delete();

        return response()->noContent();
    }
}
