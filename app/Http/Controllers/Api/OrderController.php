<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CheckoutRequest;
use App\Models\Order;
use App\Models\Subscription;
use App\Services\OrderService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    /** Lietotāja pasūtījumu vēsture. */
    public function index(Request $request)
    {
        return $request->user()->orders()
            ->with('items.product:id,name,image')
            ->latest()
            ->paginate(10);
    }

    public function show(Order $order)
    {
        Gate::authorize('view', $order);

        return $order->load(['items.product:id,name,image,species', 'subscription:id,interval_days,status']);
    }

    /**
     * Noformēšana no servera groza: transakcija + lockForUpdate (OrderService),
     * pēc izvēles — abonementi katrai groza precei ar −10 % atlaidi.
     */
    public function store(CheckoutRequest $request, OrderService $orders)
    {
        $user = $request->user();
        $cart = $user->cartOrCreate();
        $items = $cart->items()->get(['product_id', 'quantity']);

        if ($items->isEmpty()) {
            throw ValidationException::withMessages(['items' => __('messages.cart_empty')]);
        }

        $subscribe = $request->boolean('subscribe');
        $address = $request->deliveryAddress();

        $order = DB::transaction(function () use ($user, $cart, $items, $request, $orders, $subscribe, $address) {
            $order = $orders->place($user, $items->toArray(), $request->validated('delivery_type'), $address, $subscribe);

            if ($subscribe) {
                foreach ($items as $item) {
                    Subscription::create([
                        'user_id' => $user->id,
                        'product_id' => $item->product_id,
                        'quantity' => $item->quantity,
                        'interval_days' => $request->validated('interval_days'),
                        'next_delivery_date' => today()->addDays($request->validated('interval_days')),
                        'delivery_type' => $request->validated('delivery_type'),
                        'address' => $address,
                        'status' => 'aktīvs',
                    ]);
                }
            }

            $cart->items()->delete();

            return $order;
        });

        return response()->json([
            ...$order->load('items.product:id,name,image')->toArray(),
            'subscriptions_created' => $subscribe ? $items->count() : 0,
            'interval_days' => $subscribe ? (int) $request->validated('interval_days') : null,
        ], 201);
    }

    /** Pakomātu saraksts piegādes formai. */
    public function lockers()
    {
        return config('lockers');
    }
}
