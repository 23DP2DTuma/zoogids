<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;

/** Pasūtījumu redz tā īpašnieks vai administrators. */
class OrderPolicy
{
    public function view(User $user, Order $order): bool
    {
        return $user->isAdmin() || (int) $order->user_id === (int) $user->id;
    }

    public function update(User $user, Order $order): bool
    {
        return $user->isAdmin();
    }
}
