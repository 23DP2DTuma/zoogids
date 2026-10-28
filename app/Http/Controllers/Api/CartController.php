<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CartItemRequest;
use App\Http\Requests\CartMergeRequest;
use App\Models\Cart;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/** Servera grozs — vienmēr tikai pieteiktā lietotāja grozs (citu grozi nav adresējami). */
class CartController extends Controller
{
    public function show(Request $request)
    {
        return $this->present($request->user()->cartOrCreate());
    }

    public function add(CartItemRequest $request)
    {
        $cart = $request->user()->cartOrCreate();
        $product = Product::findOrFail($request->validated('product_id'));
        $item = $cart->items()->firstOrNew(['product_id' => $product->id]);
        $quantity = (int) $item->quantity + (int) $request->validated('quantity');

        $this->ensureStock($product, $quantity);
        $item->quantity = $quantity;
        $item->save();

        return $this->present($cart);
    }

    public function update(CartItemRequest $request, Product $product)
    {
        $cart = $request->user()->cartOrCreate();
        $item = $cart->items()->where('product_id', $product->id)->firstOrFail();

        $this->ensureStock($product, (int) $request->validated('quantity'));
        $item->update(['quantity' => $request->validated('quantity')]);

        return $this->present($cart);
    }

    public function remove(Request $request, Product $product)
    {
        $cart = $request->user()->cartOrCreate();
        $cart->items()->where('product_id', $product->id)->delete();

        return $this->present($cart);
    }

    /** Viesa groza pievienošana: daudzumi tiek saskaitīti un ierobežoti ar atlikumu. */
    public function merge(CartMergeRequest $request)
    {
        $cart = $request->user()->cartOrCreate();
        $products = Product::whereIn('id', collect($request->validated('items'))->pluck('product_id'))->get()->keyBy('id');

        foreach ($request->validated('items') as $line) {
            $product = $products[$line['product_id']];
            $item = $cart->items()->firstOrNew(['product_id' => $product->id]);
            $quantity = min((int) $item->quantity + (int) $line['quantity'], $product->stock);
            if ($quantity > 0) {
                $item->quantity = $quantity;
                $item->save();
            }
        }

        return $this->present($cart);
    }

    private function ensureStock(Product $product, int $quantity): void
    {
        if ($quantity > $product->stock) {
            throw ValidationException::withMessages([
                'quantity' => __('messages.stock_insufficient', ['name' => $product->name, 'stock' => $product->stock]),
            ]);
        }
    }

    private function present(Cart $cart): array
    {
        $items = $cart->items()->with('product.brand')->orderBy('id')->get();

        return [
            'items' => $items->map(fn ($i) => ['product' => $i->product, 'quantity' => $i->quantity])->values(),
        ];
    }
}
