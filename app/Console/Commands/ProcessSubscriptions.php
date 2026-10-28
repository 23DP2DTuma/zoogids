<?php

namespace App\Console\Commands;

use App\Models\Subscription;
use App\Services\OrderService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

/** Izveido pasūtījumus aktīvajiem abonementiem, kuru piegādes datums ir pienācis. */
class ProcessSubscriptions extends Command
{
    protected $signature = 'subscriptions:process';

    protected $description = 'Izveidot pasūtījumus aktīvajiem abonementiem (next_delivery_date ≤ šodiena) un pārbīdīt nākamo datumu';

    public function handle(OrderService $orders): int
    {
        $created = 0;
        $skipped = 0;

        Subscription::with(['user', 'product'])
            ->where('status', 'aktīvs')
            ->whereDate('next_delivery_date', '<=', today())
            ->chunkById(100, function ($subs) use ($orders, &$created, &$skipped) {
                foreach ($subs as $sub) {
                    try {
                        $order = $orders->place(
                            $sub->user,
                            [['product_id' => $sub->product_id, 'quantity' => $sub->quantity]],
                            $sub->delivery_type,
                            $sub->address,
                            true,
                            $sub,
                        );

                        // Nākamais datums vienmēr nākotnē, pat ja komanda nav palaista vairākas dienas
                        $next = $sub->next_delivery_date->copy();
                        while ($next->lte(today())) {
                            $next->addDays($sub->interval_days);
                        }
                        $sub->update(['next_delivery_date' => $next]);

                        $created++;
                        $this->line("Abonements #{$sub->id} → pasūtījums #{$order->id}, nākamā piegāde {$next->format('d.m.Y')}");
                    } catch (ValidationException $e) {
                        // Nepietiek preču — mēģināsim nākamajā dienā
                        $skipped++;
                        Log::warning("Abonements #{$sub->id} netika apstrādāts: ".collect($e->errors())->flatten()->first());
                        $this->warn("Abonements #{$sub->id} izlaists: nepietiek preču noliktavā");
                    }
                }
            });

        $this->info("Izveidoti pasūtījumi: {$created}, izlaisti: {$skipped}");

        return self::SUCCESS;
    }
}
