<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Product;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/** Pasūtījuma izveide: krājumu bloķēšana, piegādes maksa, atlaide, cena pirkšanas brīdī. */
class OrderService
{
    /**
     * @param  array<int, array{product_id: int, quantity: int}>  $lines
     */
    public function place(User $user, array $lines, string $deliveryType, string $address, bool $subscriptionDiscount = false, ?Subscription $subscription = null): Order
    {
        return DB::transaction(function () use ($user, $lines, $deliveryType, $address, $subscriptionDiscount, $subscription) {
            $products = Product::whereIn('id', collect($lines)->pluck('product_id'))->lockForUpdate()->get()->keyBy('id');

            $goods = 0;
            foreach ($lines as $line) {
                $p = $products[$line['product_id']] ?? null;
                if (! $p || $line['quantity'] > $p->stock) {
                    throw ValidationException::withMessages([
                        'items' => __('messages.stock_insufficient', ['name' => $p?->name ?? '#'.$line['product_id'], 'stock' => $p?->stock ?? 0]),
                    ]);
                }
                $goods += $p->price * $line['quantity'];
            }

            $fee = Order::deliveryFee($goods, $deliveryType);
            $discount = $subscriptionDiscount ? round($goods * Subscription::DISCOUNT, 2) : 0;

            $order = Order::create([
                'user_id' => $user->id,
                'subscription_id' => $subscription?->id,
                'customer_name' => trim($user->name.' '.$user->last_name),
                'email' => $user->email,
                'delivery_type' => $deliveryType,
                'address' => $address,
                'delivery_fee' => $fee,
                'discount' => $discount,
                'total' => round($goods - $discount + $fee, 2),
                'status' => 'jauns',
                'paid_at' => now(), // maksājums ir imitēts
            ]);

            foreach ($lines as $line) {
                $p = $products[$line['product_id']];
                $order->items()->create([
                    'product_id' => $p->id,
                    'quantity' => $line['quantity'],
                    'cena_bridi' => $p->price,
                ]);
                $p->decrement('stock', $line['quantity']);
            }

            return $order;
        });
    }

    /** Statusa maiņa; "atcelts" ir gala statuss — atceļot preces atgriežas noliktavā. */
    public function changeStatus(Order $order, string $status): Order
    {
        if ($order->status === 'atcelts' && $status !== 'atcelts') {
            throw ValidationException::withMessages(['status' => __('messages.order_cancelled_final')]);
        }

        DB::transaction(function () use ($order, $status) {
            $cancelling = $order->status !== 'atcelts' && $status === 'atcelts';
            $order->update(['status' => $status]);

            if ($cancelling) {
                foreach ($order->items as $item) {
                    Product::whereKey($item->product_id)->increment('stock', $item->quantity);
                }
            }
        });

        return $order;
    }
}
