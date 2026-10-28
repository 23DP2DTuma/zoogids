<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Abonementi: automātiska atkārtota piegāde ik pēc 7–90 dienām
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('quantity')->default(1);
            $table->unsignedSmallInteger('interval_days');
            $table->date('next_delivery_date');
            $table->enum('delivery_type', ['pakomāts', 'kurjers']);
            $table->string('address', 255);
            $table->enum('status', ['aktīvs', 'apturēts', 'atcelts'])->default('aktīvs');
            $table->timestamps();
            $table->index(['status', 'next_delivery_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
