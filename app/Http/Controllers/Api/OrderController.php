<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'customer_name' => 'required|string|max:60',
            'email' => 'required|email|max:50',
            'delivery_type' => 'required|in:pakomāts,kurjers',
            'address' => 'required|string|max:255',
            'subscription_interval' => 'nullable|integer|min:7|max:90',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
        ], [
            'required' => 'Lauks ":attribute" ir obligāts.',
            'email' => 'Lūdzu, ievadiet derīgu e-pasta adresi.',
            'subscription_interval.min' => 'Abonementa intervālam jābūt no 7 līdz 90 dienām.',
            'subscription_interval.max' => 'Abonementa intervālam jābūt no 7 līdz 90 dienām.',
        ]);

        $order = DB::transaction(function () use ($data) {
            $products = Product::whereIn('id', collect($data['items'])->pluck('product_id'))->lockForUpdate()->get()->keyBy('id');

            $total = 0;
            foreach ($data['items'] as $item) {
                $p = $products[$item['product_id']];
                if ($item['quantity'] > $p->stock) {
                    throw ValidationException::withMessages(['items' => "Produkts \"{$p->name}\" pieejams tikai {$p->stock} gab."]);
                }
                $total += $p->price * $item['quantity'];
            }

            // Bezmaksas piegāde no 35 EUR, citādi pakomāts 2.99 / kurjers 5.99
            $delivery = $total >= 35 ? 0 : ($data['delivery_type'] === 'pakomāts' ? 2.99 : 5.99);

            // Abonementam -10 % atlaide precēm
            if (! empty($data['subscription_interval'])) {
                $total *= 0.9;
            }
            $total += $delivery;

            $order = Order::create([
                ...collect($data)->except('items')->all(),
                'total' => round($total, 2),
            ]);

            foreach ($data['items'] as $item) {
                $p = $products[$item['product_id']];
                $order->items()->create([
                    'product_id' => $p->id,
                    'quantity' => $item['quantity'],
                    'cena_bridi' => $p->price,
                ]);
                $p->decrement('stock', $item['quantity']);
            }

            return $order;
        });

        return response()->json($order->load('items.product:id,name,image'), 201);
    }
}
