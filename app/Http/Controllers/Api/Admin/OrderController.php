<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StatusRequest;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $data = $request->validate(['q' => 'nullable|string|max:100', 'status' => 'nullable|in:'.implode(',', Order::STATUSES)]);

        return Order::withCount('items')
            ->with('items.product:id,name,image')
            ->when($data['status'] ?? null, fn ($query, $v) => $query->where('status', $v))
            ->when($data['q'] ?? null, fn ($query, $v) => $query->where(function ($w) use ($v) {
                if (ctype_digit(ltrim($v, '#'))) {
                    $w->where('id', (int) ltrim($v, '#'));
                }
                $w->orWhere('customer_name', 'like', "%{$v}%")->orWhere('email', 'like', "%{$v}%");
            }))
            ->latest()
            ->paginate(10)
            ->withQueryString();
    }

    public function update(StatusRequest $request, Order $order, OrderService $orders)
    {
        return $orders->changeStatus($order->load('items'), $request->validated('status'))->loadCount('items');
    }
}
