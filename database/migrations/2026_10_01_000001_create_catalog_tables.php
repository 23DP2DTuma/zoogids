<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('slug', 100)->unique();
            $table->string('icon', 10)->nullable();
            $table->timestamps();
        });

        Schema::create('brands', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->timestamps();
        });

        Schema::create('problems', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            // Atslēgvārdi gudrajam filtram, atdalīti ar komatu (lv / ru / en)
            $table->text('keywords');
            $table->text('advice')->nullable();
            $table->timestamps();
        });

        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->foreignId('brand_id')->constrained()->cascadeOnDelete();
            $table->string('name', 255);
            $table->text('description');
            $table->decimal('price', 8, 2);
            $table->unsignedInteger('stock')->default(0);
            $table->enum('species', ['suns', 'kaķis', 'grauzējs', 'putns']);
            $table->enum('age_group', ['jauns', 'pieaugušais', 'seniors', 'visi'])->default('visi');
            $table->unsignedInteger('package_weight')->nullable(); // grami
            $table->unsignedInteger('kcal_per_100g')->nullable();
            $table->string('ingredients', 255)->nullable(); // alergēnu pārbaudei
            $table->string('image', 255)->nullable();       // emoji prototipā
            $table->decimal('rating', 2, 1)->default(0);
            $table->timestamps();
        });

        Schema::create('problem_product', function (Blueprint $table) {
            $table->foreignId('problem_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->primary(['problem_id', 'product_id']);
        });

        Schema::create('articles', function (Blueprint $table) {
            $table->id();
            $table->string('title', 255);
            $table->string('excerpt', 300);
            $table->text('content');
            $table->enum('species', ['suns', 'kaķis', 'grauzējs', 'putns']);
            $table->date('published_at');
            $table->timestamps();
        });

        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('customer_name', 60);
            $table->string('email', 50);
            $table->enum('delivery_type', ['pakomāts', 'kurjers']);
            $table->string('address', 255);
            $table->decimal('total', 10, 2);
            $table->string('status', 30)->default('jauns');
            $table->unsignedSmallInteger('subscription_interval')->nullable(); // 7–90 dienas
            $table->timestamps();
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained();
            $table->unsignedInteger('quantity');
            $table->decimal('cena_bridi', 8, 2);
        });
    }

    public function down(): void
    {
        foreach (['order_items', 'orders', 'articles', 'problem_product', 'products', 'problems', 'brands', 'categories'] as $t) {
            Schema::dropIfExists($t);
        }
    }
};
