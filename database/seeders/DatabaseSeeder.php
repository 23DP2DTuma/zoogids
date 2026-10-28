<?php

namespace Database\Seeders;

use App\Models\Article;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Problem;
use App\Models\Product;
use App\Models\Review;
use App\Models\Subscription;
use App\Models\User;
use App\Services\OrderService;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::create(['name' => 'Administrators', 'last_name' => 'ZooGids', 'email' => 'admin@zoogids.lv', 'password' => 'Admin2026!']);
        $admin->forceFill(['role' => 'admin'])->save();

        $anna = User::create(['name' => 'Anna', 'last_name' => 'Bērziņa', 'email' => 'anna@mail.com', 'password' => 'Anna2026!']);

        // Katalogs no catalog.json
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
            unset($row['problems'], $row['rating']); // vērtējums tiek aprēķināts no atsauksmēm
            Product::create($row)->problems()->attach($problems);
        }
        foreach ($data['articles'] as $row) {
            Article::create($row);
        }

        $this->seedDemoUser($anna);
        $this->seedCustomers();
    }

    /** Demo lietotājs Anna: 2 mīluļi ar atgādinājumiem, pasūtījumi dažādos statusos, abonements, atsauksmes. */
    private function seedDemoUser(User $anna): void
    {
        // Atgādinājumu datumi relatīvi pret šodienu, lai zvaniņš rādītu tuvākos
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

        $this->seedOrders($anna, [
            // [dienas atpakaļ, statuss, [[produkta id, daudzums], ...], piegāde]
            [40, 'piegādāts', [[1, 1], [13, 1]], 'kurjers'],
            [25, 'piegādāts', [[5, 2], [17, 1]], 'pakomāts'],
            [10, 'atcelts', [[16, 1]], 'pakomāts'],
            [3, 'nosūtīts', [[9, 2]], 'pakomāts'],
            [1, 'apstrādē', [[12, 1]], 'kurjers'],
        ]);

        // Aktīvs abonements: kaķēnu barība Mincei ik pēc 30 dienām (pirmais pasūtījums šodien, −10 %)
        $locker = 'Omniva pakomāts "Origo", Stacijas laukums 2, Rīga';
        $sub = Subscription::create([
            'user_id' => $anna->id, 'product_id' => 6, 'quantity' => 1, 'interval_days' => 30,
            'next_delivery_date' => today()->addDays(30), 'delivery_type' => 'pakomāts', 'address' => $locker, 'status' => 'aktīvs',
        ]);
        app(OrderService::class)->place($anna, [['product_id' => 6, 'quantity' => 1]], 'pakomāts', $locker, true, $sub);

        // Produktiem 13 un 17 atsauksme vēl nav — demonstrācijai "Rakstīt atsauksmi"
        $this->review($anna, 1, 5, 'Reksis ēd ar lielu prieku, un jēra barība neizraisa alerģiju. Iesaku!', 38);
        $this->review($anna, 5, 4, 'Spalva kļuva spīdīgāka jau pēc pāris nedēļām. Granulas gan diezgan lielas.', 20);
    }

    /** Citi pircēji ar piegādātiem pasūtījumiem un atsauksmēm (vērtējumu un statistikas demonstrācijai). */
    private function seedCustomers(): void
    {
        $customers = [
            ['Jānis', 'Ozols', 'janis@mail.com', [[1, 1], [2, 1], [10, 2], [12, 1], [15, 1], [16, 1]], [
                [1, 5, 'Labākā barība, ko esam izmēģinājuši.'],
                [2, 5, 'Kucēns aug vesels un enerģisks.'],
                [10, 4, 'Zobi tīrāki, bet gardumi ātri beidzas.'],
                [12, 5, 'Ķemme lieliski izķemmē pavilnu.'],
                [15, 4, 'Ērces vairs nav redzētas, siksna gan nedaudz smaržo.'],
                [16, 5, 'Suns aizņemts vismaz 20 minūtes — lieliski!'],
            ]],
            ['Līga', 'Kalniņa', 'liga@mail.com', [[5, 1], [6, 1], [7, 1], [8, 2], [11, 1], [14, 1], [17, 1]], [
                [5, 5, 'Kaķis mazāk met spalvu.'],
                [6, 5, 'Kaķēns barību apēd līdz pēdējai granulai.'],
                [7, 4, 'Laba barība sterilizētam kaķim.'],
                [8, 4, 'Mitrā barība jutīgam vēderam — der.'],
                [11, 5, 'Spalvu kamoli vairs nav problēma.'],
                [14, 4, 'Pilieni iedarbojās ātri.'],
                [17, 5, 'Kaķis no makšķeres neatkāpjas!'],
            ]],
            ['Oskars', 'Liepiņš', 'oskars@mail.com', [[3, 1], [4, 1], [9, 2], [13, 1], [18, 1], [19, 1]], [
                [3, 4, 'Suns zaudēja 1,5 kg divos mēnešos.'],
                [4, 5, 'Vecajam sunim kļuva vieglāk kustēties.'],
                [9, 4, 'Mitrā barība — suns sajūsmā.'],
                [13, 3, 'Šampūns labs, bet pudele maza.'],
                [18, 5, 'Truši ēd ar prieku.'],
                [19, 4, 'Papagailis ir apmierināts.'],
                [2, 1, 'NEPIRKT!!! spam spam www.lēts-barība.lv'], // paslēpta atsauksme (moderācija)
            ]],
        ];

        foreach ($customers as $i => [$name, $last, $email, $lines, $reviews]) {
            $user = User::create(['name' => $name, 'last_name' => $last, 'email' => $email, 'password' => 'Demo2026!']);
            $this->seedOrders($user, [[60 - $i * 7, 'piegādāts', $lines, $i % 2 ? 'pakomāts' : 'kurjers']]);
            foreach ($reviews as [$productId, $rating, $comment]) {
                $review = $this->review($user, $productId, $rating, $comment, 50 - $i * 7);
                if ($rating === 1) {
                    $review->forceFill(['is_visible' => false])->save();
                }
            }
        }
    }

    /** Demo pasūtījumi ar dažādiem statusiem un datumiem pagātnē. */
    private function seedOrders(User $user, array $orders): void
    {
        $service = app(OrderService::class);
        $address = ['kurjers' => 'Brīvības iela 10-5, Rīga, LV-1010', 'pakomāts' => 'DPD pakomāts "Akropole Alfa", Brīvības gatve 372, Rīga'];

        foreach ($orders as [$daysAgo, $status, $lines, $delivery]) {
            $order = $service->place($user, array_map(fn ($l) => ['product_id' => $l[0], 'quantity' => $l[1]], $lines), $delivery, $address[$delivery]);
            $service->changeStatus($order, $status);
            $date = now()->subDays($daysAgo);
            $order->forceFill(['created_at' => $date, 'updated_at' => $date, 'paid_at' => $date])->saveQuietly();
        }
    }

    private function review(User $user, int $productId, int $rating, string $comment, int $daysAgo): Review
    {
        $review = new Review(['rating' => $rating, 'comment' => $comment]);
        $review->user()->associate($user);
        $review->product_id = $productId;
        $review->created_at = $review->updated_at = now()->subDays($daysAgo);
        $review->save();

        return $review;
    }
}
