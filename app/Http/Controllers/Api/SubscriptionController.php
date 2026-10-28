<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SubscriptionRequest;
use App\Models\Subscription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class SubscriptionController extends Controller
{
    public function index(Request $request)
    {
        return $request->user()->subscriptions()
            ->with('product:id,name,image,price,stock')
            ->orderByRaw("status = 'atcelts'")
            ->orderBy('next_delivery_date')
            ->get();
    }

    /** Apturēt / atsākt / atcelt, mainīt intervālu un daudzumu. */
    public function update(SubscriptionRequest $request, Subscription $subscription)
    {
        Gate::authorize('update', $subscription);

        if ($subscription->status === 'atcelts') {
            throw ValidationException::withMessages(['status' => __('messages.subscription_cancelled')]);
        }

        $data = $request->validated();

        if (isset($data['quantity']) && $data['quantity'] > $subscription->product->stock) {
            throw ValidationException::withMessages([
                'quantity' => __('messages.stock_insufficient', ['name' => $subscription->product->name, 'stock' => $subscription->product->stock]),
            ]);
        }

        // Atsākot abonementu, nākamā piegāde nevar būt pagātnē
        if (($data['status'] ?? null) === 'aktīvs' && $subscription->next_delivery_date->lt(today()->addDay())) {
            $data['next_delivery_date'] = today()->addDay();
        }

        $subscription->update($data);

        return $subscription->load('product:id,name,image,price,stock');
    }
}
