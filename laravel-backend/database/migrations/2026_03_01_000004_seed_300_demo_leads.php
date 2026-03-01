<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        // Get agent users to distribute leads across
        $agents = DB::table('users')
            ->whereIn('role', ['agent', 'agency_owner'])
            ->pluck('id')
            ->toArray();

        // Fallback: use any user if no agents exist
        if (empty($agents)) {
            $agents = DB::table('users')->pluck('id')->toArray();
        }
        if (empty($agents)) {
            return; // No users at all — skip
        }

        // Get agencies
        $agencies = DB::table('agencies')->pluck('id')->toArray();

        $insuranceTypes = ['auto', 'homeowners', 'health_individual', 'life_term', 'life_whole', 'commercial_general', 'disability_short_term', 'disability_long_term', 'health_family', 'commercial_bop', 'renters', 'umbrella'];
        $statuses = ['new', 'contacted', 'quoted', 'applied', 'won', 'lost'];
        $statusWeights = [35, 25, 20, 10, 5, 5]; // Realistic distribution %
        $sources = ['website', 'referral', 'marketplace', 'embed_widget', 'phone', 'social_media', 'google_ads'];

        $firstNames = [
            'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth',
            'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Christopher', 'Karen',
            'Charles', 'Lisa', 'Daniel', 'Nancy', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra',
            'Donald', 'Ashley', 'Steven', 'Kimberly', 'Andrew', 'Emily', 'Paul', 'Donna', 'Joshua', 'Michelle',
            'Kenneth', 'Carol', 'Kevin', 'Amanda', 'Brian', 'Dorothy', 'George', 'Melissa', 'Timothy', 'Deborah',
            'Ronald', 'Stephanie', 'Edward', 'Rebecca', 'Jason', 'Sharon', 'Jeffrey', 'Laura', 'Ryan', 'Cynthia',
            'Jacob', 'Kathleen', 'Gary', 'Amy', 'Nicholas', 'Angela', 'Eric', 'Shirley', 'Jonathan', 'Anna',
            'Stephen', 'Brenda', 'Larry', 'Pamela', 'Justin', 'Emma', 'Scott', 'Nicole', 'Brandon', 'Helen',
            'Benjamin', 'Samantha', 'Samuel', 'Katherine', 'Raymond', 'Christine', 'Gregory', 'Debra', 'Frank', 'Rachel',
            'Alexander', 'Carolyn', 'Patrick', 'Janet', 'Jack', 'Catherine', 'Dennis', 'Maria', 'Jerry', 'Heather',
        ];

        $lastNames = [
            'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
            'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
            'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
            'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
            'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
            'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes',
            'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper',
            'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson',
            'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes',
            'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers', 'Long', 'Ross', 'Foster', 'Jimenez',
        ];

        // Weighted random status picker
        $pickStatus = function () use ($statuses, $statusWeights) {
            $rand = mt_rand(1, 100);
            $cumulative = 0;
            foreach ($statuses as $i => $status) {
                $cumulative += $statusWeights[$i];
                if ($rand <= $cumulative) {
                    return $status;
                }
            }
            return 'new';
        };

        $batch = [];

        for ($i = 100; $i < 400; $i++) {
            $firstName = $firstNames[array_rand($firstNames)];
            $lastName = $lastNames[array_rand($lastNames)];
            $type = $insuranceTypes[array_rand($insuranceTypes)];
            $status = $pickStatus();
            $source = $sources[array_rand($sources)];
            $agentId = $agents[array_rand($agents)];
            $agencyId = !empty($agencies) ? $agencies[array_rand($agencies)] : null;

            // Estimated value varies by insurance type
            $valueRanges = [
                'auto' => [800, 3000],
                'homeowners' => [1200, 5000],
                'renters' => [200, 800],
                'health_individual' => [3000, 12000],
                'health_family' => [6000, 24000],
                'life_term' => [500, 3000],
                'life_whole' => [2000, 15000],
                'commercial_general' => [5000, 50000],
                'commercial_bop' => [3000, 25000],
                'disability_short_term' => [600, 3000],
                'disability_long_term' => [1200, 6000],
                'umbrella' => [300, 2000],
            ];
            $range = $valueRanges[$type] ?? [500, 5000];
            $estimatedValue = mt_rand($range[0], $range[1]);

            // Spread creation dates over last 90 days
            $daysAgo = mt_rand(0, 90);
            $createdAt = $now->copy()->subDays($daysAgo)->subHours(mt_rand(0, 23))->subMinutes(mt_rand(0, 59));

            $batch[] = [
                'agent_id' => $agentId,
                'agency_id' => $agencyId,
                'first_name' => $firstName,
                'last_name' => $lastName,
                'email' => "michelevens+client{$i}@gmail.com",
                'phone' => sprintf('(%03d) %03d-%04d', mt_rand(200, 999), mt_rand(200, 999), mt_rand(1000, 9999)),
                'insurance_type' => $type,
                'status' => $status,
                'source' => $source,
                'estimated_value' => $estimatedValue,
                'notes' => null,
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ];

            // Insert in batches of 50
            if (count($batch) >= 50) {
                DB::table('leads')->insert($batch);
                $batch = [];
            }
        }

        // Insert remaining
        if (!empty($batch)) {
            DB::table('leads')->insert($batch);
        }
    }

    public function down(): void
    {
        DB::table('leads')
            ->where('email', 'like', 'michelevens+client%@gmail.com')
            ->delete();
    }
};
