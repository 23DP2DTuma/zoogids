<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StatusRequest;
use App\Models\Subscription;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    public function index(Request $request)
    {
        $data = $request->validate(['q' => 'nullable|string|max:100', 'status' => 'nullable|in:'.implode(',', Subscription::STATUSES)]);

        return Subscription::with(['user:id,name,last_name,email', 'product:id,name,image'])
            ->when($data['status'] ?? null, fn ($query, $v) => $query->where('status', $v))
            ->when($data['q'] ?? null, fn ($query, $v) => $query->whereHas('user', fn ($u) => $u->where('email', 'like', "%{$v}%")->orWhere('name', 'like', "%{$v}%")))
            ->orderBy('next_delivery_date')
            ->paginate(10)
            ->withQueryString();
    }

    public function update(StatusRequest $request, Subscription $subscription)
    {
        $data = ['status' => $request->validated('status')];
        if ($data['status'] === 'aktīvs' && $subscription->next_delivery_date->lt(today()->addDay())) {
            $data['next_delivery_date'] = today()->addDay();
        }
        $subscription->update($data);

        return $subscription->load(['user:id,name,last_name,email', 'product:id,name,image']);
    }
}
