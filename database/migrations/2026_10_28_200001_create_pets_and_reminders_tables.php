<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Mīluļi
        Schema::create('pets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name', 50);
            $table->enum('species', ['suns', 'kaķis', 'grauzējs', 'putns']);
            $table->string('breed', 50)->nullable();
            $table->date('birth_date')->nullable();
            $table->decimal('weight', 5, 2); // kg
            $table->string('allergies', 255)->nullable();
            $table->enum('activity', ['low', 'normal', 'high'])->default('normal');
            $table->timestamps();
        });

        // Atgādinājumi
        Schema::create('reminders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pet_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['vakcinācija', 'pretparazītu', 'vizīte']);
            $table->date('date');
            $table->string('description', 255)->nullable();
            $table->timestamps();
            $table->index(['pet_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reminders');
        Schema::dropIfExists('pets');
    }
};
