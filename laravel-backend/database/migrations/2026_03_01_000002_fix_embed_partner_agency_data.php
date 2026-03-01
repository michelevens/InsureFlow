<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Fix embed partner data:
     * 1. Create missing Agency records for Maximus, Clearstone, Bamboo
     * 2. Link their embed partners (quote + team_signup) to correct agencies
     * 3. Previously all 3 team_signup widgets pointed to Martinez (agency 16)
     */
    public function up(): void
    {
        $now = now();

        // Create missing agencies
        $agencies = [
            [
                'name'        => 'Maximus Insurance Group',
                'slug'        => 'maximus-insurance-group',
                'agency_code' => 'MAXIMUS',
                'email'       => 'contact+maximus@ennhealth.com',
                'phone'       => '(555) 400-0001',
                'city'        => 'Austin',
                'state'       => 'TX',
                'is_verified' => true,
                'is_active'   => true,
                'description' => 'Full-service insurance group specializing in personal and commercial lines.',
                'created_at'  => $now,
                'updated_at'  => $now,
            ],
            [
                'name'        => 'Clearstone Insurance',
                'slug'        => 'clearstone-insurance',
                'agency_code' => 'CLRSTN',
                'email'       => 'contact+clearstone@ennhealth.com',
                'phone'       => '(555) 400-0002',
                'city'        => 'Tampa',
                'state'       => 'FL',
                'is_verified' => true,
                'is_active'   => true,
                'description' => 'Independent insurance agency providing transparent coverage solutions.',
                'created_at'  => $now,
                'updated_at'  => $now,
            ],
            [
                'name'        => 'Bamboo Insurance',
                'slug'        => 'bamboo-insurance',
                'agency_code' => 'BAMBOO',
                'email'       => 'contact+bamboo@ennhealth.com',
                'phone'       => '(555) 400-0003',
                'city'        => 'Orlando',
                'state'       => 'FL',
                'is_verified' => true,
                'is_active'   => true,
                'description' => 'Modern insurance agency focused on digital-first customer experiences.',
                'created_at'  => $now,
                'updated_at'  => $now,
            ],
        ];

        foreach ($agencies as $agencyData) {
            // Skip if already exists
            $existing = DB::table('agencies')->where('agency_code', $agencyData['agency_code'])->first();
            if ($existing) {
                continue;
            }
            DB::table('agencies')->insert($agencyData);
        }

        // Now link embed partners to correct agencies
        $linkMap = [
            'Maximus Insurance Group'        => 'MAXIMUS',
            'Maximus Insurance Group - Team'  => 'MAXIMUS',
            'Maximus'                         => 'MAXIMUS',
            'Clearstone Insurance'            => 'CLRSTN',
            'Clearstone Insurance - Team'     => 'CLRSTN',
            'Bamboo Insurance'                => 'BAMBOO',
            'Bamboo Insurance - Team'         => 'BAMBOO',
        ];

        foreach ($linkMap as $partnerName => $agencyCode) {
            $agency = DB::table('agencies')->where('agency_code', $agencyCode)->first();
            if (!$agency) {
                continue;
            }

            DB::table('embed_partners')
                ->where('name', $partnerName)
                ->update(['agency_id' => $agency->id, 'updated_at' => $now]);
        }
    }

    public function down(): void
    {
        // Revert embed partners back to no agency link
        DB::table('embed_partners')
            ->whereIn('name', [
                'Maximus Insurance Group', 'Maximus Insurance Group - Team', 'Maximus',
                'Clearstone Insurance', 'Clearstone Insurance - Team',
                'Bamboo Insurance', 'Bamboo Insurance - Team',
            ])
            ->update(['agency_id' => null]);

        // Remove the created agencies
        DB::table('agencies')->whereIn('agency_code', ['MAXIMUS', 'CLRSTN', 'BAMBOO'])->delete();
    }
};
