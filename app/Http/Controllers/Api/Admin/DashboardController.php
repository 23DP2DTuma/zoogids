<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Review;
use App\Models\Subscription;
use App\Models\User;

/** Pārdošanas statistika administratora panelim. */
class DashboardController extends Controller
{
    public function __invoke()
    {
        $paid = Order::where('status', '!=', 'atcelts');

        $byStatus = Order::selectRaw('status, count(*) as count')->groupBy('status')->pluck('count', 'status');

        $top = OrderItem::query()
            ->whereHas('order', fn ($q) => $q->where('status', '!=', 'atcelts'))
            ->selectRaw('product_id, sum(quantity) as sold, sum(quantity * cena_bridi) as revenue')
            ->groupBy('product_id')
            ->orderByDesc('sold')
            ->limit(5)
            ->with('product:id,name,image')
            ->get();

        return [
            'orders' => (clone $paid)->count(),
            'revenue' => round((float) (clone $paid)->sum('total'), 2),
            'revenue_30d' => round((float) (clone $paid)->where('created_at', '>=', now()->subDays(30))->sum('total'), 2),
            'average_order' => round((float) (clone $paid)->avg('total'), 2),
            'users' => User::where('role', 'user')->count(),
            'active_subscriptions' => Subscription::where('status', 'aktīvs')->count(),
            'hidden_reviews' => Review::where('is_visible', false)->count(),
            'by_status' => collect(Order::STATUSES)->mapWithKeys(fn ($s) => [$s => (int) ($byStatus[$s] ?? 0)]),
            'top_products' => $top->map(fn ($row) => [
                'product' => $row->product,
                'sold' => (int) $row->sold,
                'revenue' => round((float) $row->revenue, 2),
            ]),
            'low_stock' => Product::where('stock', '<', 10)->orderBy('stock')->limit(5)->get(['id', 'name', 'stock', 'image']),
        ];
    }
}
