<?php

namespace App\Policies;

use App\Models\Review;
use App\Models\User;

/** Savu atsauksmi var labot / dzēst autors; administrators moderē caur /api/admin. */
class ReviewPolicy
{
    public function update(User $user, Review $review): bool
    {
        return (int) $review->user_id === (int) $user->id;
    }

    public function delete(User $user, Review $review): bool
    {
        return $user->isAdmin() || (int) $review->user_id === (int) $user->id;
    }
}
