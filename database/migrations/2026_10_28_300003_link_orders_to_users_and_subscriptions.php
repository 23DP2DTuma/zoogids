<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Pasūtījumi tiek piesaistīti lietotājam (dzēšot kontu — user_id = null, vēsture paliek).
 * orders.subscription_interval tiek aizstāts ar atsevišķu tabulu "subscriptions":
 * pasūtījums, kas izveidots no abonementa, glabā subscription_id.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->after('id')->constrained()->nullOnDelete();
            $table->foreignId('subscription_id')->nullable()->after('user_id')->constrained()->nullOnDelete();
            $table->decimal('delivery_fee', 6, 2)->default(0)->after('address');
            $table->decimal('discount', 8, 2)->default(0)->after('delivery_fee');
            $table->timestamp('paid_at')->nullable()->after('status');
            $table->index('status');
            $table->dropColumn('subscription_interval');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->unsignedSmallInteger('subscription_interval')->nullable();
            $table->dropIndex(['status']);
            $table->dropConstrainedForeignId('subscription_id');
            $table->dropConstrainedForeignId('user_id');
            $table->dropColumn(['delivery_fee', 'discount', 'paid_at']);
        });
    }
};
