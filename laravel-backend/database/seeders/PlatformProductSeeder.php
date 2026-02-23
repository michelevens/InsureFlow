<?php

namespace Database\Seeders;

use App\Models\LeadScenario;
use App\Models\PlatformProduct;
use Illuminate\Database\Seeder;

class PlatformProductSeeder extends Seeder
{
    private function iconMap(): array
    {
        return [
            'auto' => 'Car',
            'homeowners' => 'Home',
            'renters' => 'Building2',
            'condo' => 'Building',
            'flood' => 'Droplets',
            'umbrella_personal' => 'Umbrella',
            'motorcycle' => 'Bike',
            'boat_watercraft' => 'Ship',
            'rv_motorhome' => 'Truck',
            'jewelry_valuables' => 'Gem',
            'life_term' => 'HeartPulse',
            'life_whole' => 'Heart',
            'life_universal' => 'Sparkles',
            'life_final_expense' => 'Shield',
            'annuity' => 'PiggyBank',
            'health_individual' => 'Stethoscope',
            'health_group' => 'Users',
            'dental' => 'Smile',
            'vision' => 'Eye',
            'medicare_supplement' => 'Cross',
            'medicare_advantage' => 'Plus',
            'prescription_drug' => 'Pill',
            'disability_short_term' => 'Clock',
            'disability_long_term' => 'CalendarDays',
            'long_term_care' => 'Bed',
            'commercial_gl' => 'Briefcase',
            'commercial_property' => 'Warehouse',
            'bop' => 'Package',
            'workers_comp' => 'HardHat',
            'commercial_auto' => 'Truck',
            'professional_liability' => 'Scale',
            'cyber_liability' => 'Lock',
            'directors_officers' => 'UserCog',
            'epli' => 'Users',
            'surety_bond' => 'FileCheck',
            'umbrella_commercial' => 'Umbrella',
            'inland_marine' => 'Container',
            'event_liability' => 'Calendar',
            'travel' => 'Plane',
            'pet' => 'PawPrint',
        ];
    }

    public function run(): void
    {
        $icons = $this->iconMap();
        $sortOrder = 0;

        foreach (LeadScenario::productTypes() as $category => $products) {
            foreach ($products as $slug => $name) {
                PlatformProduct::updateOrCreate(
                    ['slug' => $slug],
                    [
                        'name' => $name,
                        'category' => $category,
                        'icon' => $icons[$slug] ?? 'ShieldCheck',
                        'is_active' => true,
                        'sort_order' => $sortOrder++,
                    ]
                );
            }
        }
    }
}
