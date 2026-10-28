<?php

namespace Database\Seeders;

use App\Models\Article;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Problem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'admin@zoogids.lv'],
            ['name' => 'Administrators', 'password' => bcrypt('Admin2026!')]
        );

        $data = json_decode(file_get_contents(__DIR__.'/data/catalog.json'), true);

        foreach ($data['categories'] as $row) {
            Category::create($row);
        }
        foreach ($data['brands'] as $row) {
            Brand::create($row);
        }
        foreach ($data['problems'] as $row) {
            Problem::create($row);
        }
        foreach ($data['products'] as $row) {
            $problems = $row['problems'];
            unset($row['problems']);
            Product::create($row)->problems()->attach($problems);
        }
        foreach ($data['articles'] as $row) {
            Article::create($row);
        }
    }
}
