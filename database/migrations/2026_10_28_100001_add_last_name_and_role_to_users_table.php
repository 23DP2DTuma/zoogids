<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // "name" glabā vārdu, "last_name" — uzvārdu
            $table->string('last_name', 30)->nullable()->after('name');
            $table->enum('role', ['user', 'admin'])->default('user')->after('password');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['last_name', 'role']);
        });
    }
};
