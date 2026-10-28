<?php

namespace App\Policies;

use App\Models\Pet;
use App\Models\User;

/** Lietotājs drīkst pārvaldīt tikai savus mīluļus. */
class PetPolicy
{
    public function view(User $user, Pet $pet): bool
    {
        return (int) $pet->user_id === (int) $user->id;
    }

    public function update(User $user, Pet $pet): bool
    {
        return (int) $pet->user_id === (int) $user->id;
    }

    public function delete(User $user, Pet $pet): bool
    {
        return (int) $pet->user_id === (int) $user->id;
    }
}
