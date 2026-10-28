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
        $admin = User::create(['name' => 'Administrators', 'last_name' => 'ZooGids', 'email' => 'admin@zoogids.lv', 'password' => 'Admin2026!']);
        $admin->forceFill(['role' => 'admin'])->save();

        $anna = User::create(['name' => 'Anna', 'last_name' => 'Bērziņa', 'email' => 'anna@mail.com', 'password' => 'Anna2026!']);

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

        $this->seedDemoUser($anna);
    }

    /** Demo lietotāja mīluļi un atgādinājumi (datumi relatīvi pret šodienu, lai zvaniņš rādītu tuvākos). */
    private function seedDemoUser(User $anna): void
    {
        $reksis = $anna->pets()->create([
            'name' => 'Reksis', 'species' => 'suns', 'breed' => 'bīgls', 'birth_date' => '2023-03-14',
            'weight' => 12.50, 'allergies' => 'vista', 'activity' => 'normal',
        ]);
        $reksis->reminders()->createMany([
            ['type' => 'pretparazītu', 'date' => today()->addDays(6), 'description' => 'Ērču un blusu tabletes'],
            ['type' => 'vakcinācija', 'date' => today()->addMonths(4), 'description' => 'Ikgadējā vakcīna pret trakumsērgu'],
        ]);

        $mince = $anna->pets()->create([
            'name' => 'Mince', 'species' => 'kaķis', 'breed' => null, 'birth_date' => today()->subMonths(5),
            'weight' => 2.10, 'allergies' => null, 'activity' => 'high',
        ]);
        $mince->reminders()->createMany([
            ['type' => 'vakcinācija', 'date' => today()->addDays(14), 'description' => 'Otrā kompleksā vakcīna'],
            ['type' => 'vizīte', 'date' => today()->addDays(25), 'description' => 'Veterinārārsta apskate'],
        ]);
    }
}
