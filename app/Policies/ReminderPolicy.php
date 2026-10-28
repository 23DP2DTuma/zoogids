<?php

namespace App\Policies;

use App\Models\Reminder;
use App\Models\User;

/** Atgādinājums pieder mīluļa īpašniekam. */
class ReminderPolicy
{
    public function update(User $user, Reminder $reminder): bool
    {
        return (int) $reminder->pet->user_id === (int) $user->id;
    }

    public function delete(User $user, Reminder $reminder): bool
    {
        return (int) $reminder->pet->user_id === (int) $user->id;
    }
}
