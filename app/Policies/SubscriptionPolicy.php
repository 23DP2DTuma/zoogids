<?php

namespace App\Policies;

use App\Models\Subscription;
use App\Models\User;

/** Abonementu maina tikai tā īpašnieks (administrators — caur /api/admin). */
class SubscriptionPolicy
{
    public function update(User $user, Subscription $subscription): bool
    {
        return (int) $subscription->user_id === (int) $user->id;
    }
}
