<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Indeksi kataloga filtriem (category_id un brand_id indeksi jau ir no FK). */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->index('species');
            $table->index('price');
            $table->index(['species', 'category_id', 'brand_id', 'price'], 'products_catalog_index');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('products_catalog_index');
            $table->dropIndex(['price']);
            $table->dropIndex(['species']);
        });
    }
};
