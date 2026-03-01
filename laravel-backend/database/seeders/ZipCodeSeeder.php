<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ZipCodeSeeder extends Seeder
{
    public function run(): void
    {
        $csvPath = database_path('data/us-zipcodes.csv');

        if (!file_exists($csvPath)) {
            $this->command?->error("CSV not found: {$csvPath}");
            return;
        }

        $handle = fopen($csvPath, 'r');
        $header = fgetcsv($handle); // skip header row
        $now = now();
        $batch = [];
        $total = 0;

        while (($row = fgetcsv($handle)) !== false) {
            if (count($row) < 4) continue;

            $batch[] = [
                'zip'        => str_pad($row[0], 5, '0', STR_PAD_LEFT),
                'city'       => ucwords(strtolower($row[1])),
                'state'      => $row[2],
                'county'     => $row[3] ?: null,
                'latitude'   => $row[4] !== '' ? (float) $row[4] : null,
                'longitude'  => $row[5] !== '' ? (float) $row[5] : null,
                'timezone'   => null,
                'created_at' => $now,
                'updated_at' => $now,
            ];

            if (count($batch) >= 500) {
                DB::table('zip_codes')->upsert(
                    $batch,
                    ['zip', 'city', 'state'],
                    ['county', 'latitude', 'longitude', 'updated_at']
                );
                $total += count($batch);
                $batch = [];
            }
        }

        // Insert remaining rows
        if (!empty($batch)) {
            DB::table('zip_codes')->upsert(
                $batch,
                ['zip', 'city', 'state'],
                ['county', 'latitude', 'longitude', 'updated_at']
            );
            $total += count($batch);
        }

        fclose($handle);
        $this->command?->info("Seeded {$total} ZIP codes from CSV.");
    }
}
