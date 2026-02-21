<?php

namespace Database\Seeders;

use App\Models\Carrier;
use App\Models\CarrierProduct;
use Illuminate\Database\Seeder;

class CarrierSeeder extends Seeder
{
    public function run(): void
    {
        $carriers = [
            [
                'name' => 'State Farm',
                'slug' => 'state-farm',
                'description' => 'America\'s largest auto and home insurance provider.',
                'am_best_rating' => 'A++',
                'states_available' => ['TX', 'CA', 'FL', 'NY', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI'],
                'products' => [
                    ['name' => 'State Farm Auto', 'insurance_type' => 'auto', 'min_premium' => 80, 'max_premium' => 200, 'deductible_options' => [250, 500, 1000], 'coverage_options' => ['$50,000', '$100,000', '$250,000'], 'features' => ['Roadside Assistance', 'Rental Reimbursement', 'Good Driver Discount']],
                    ['name' => 'State Farm Home', 'insurance_type' => 'home', 'min_premium' => 100, 'max_premium' => 350, 'deductible_options' => [500, 1000, 2500], 'coverage_options' => ['$200,000', '$350,000', '$500,000'], 'features' => ['Replacement Cost', 'Personal Property', 'Liability Protection']],
                ],
            ],
            [
                'name' => 'Geico',
                'slug' => 'geico',
                'description' => 'Known for competitive auto insurance rates.',
                'am_best_rating' => 'A++',
                'states_available' => ['TX', 'CA', 'FL', 'NY', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI'],
                'products' => [
                    ['name' => 'Geico Auto', 'insurance_type' => 'auto', 'min_premium' => 70, 'max_premium' => 180, 'deductible_options' => [250, 500, 1000], 'coverage_options' => ['$50,000', '$100,000', '$300,000'], 'features' => ['Multi-Policy Discount', 'Military Discount', 'Accident Forgiveness']],
                ],
            ],
            [
                'name' => 'Progressive',
                'slug' => 'progressive',
                'description' => 'Innovative insurance with Name Your Price tool.',
                'am_best_rating' => 'A+',
                'states_available' => ['TX', 'CA', 'FL', 'NY', 'IL', 'OH', 'GA', 'NC'],
                'products' => [
                    ['name' => 'Progressive Auto', 'insurance_type' => 'auto', 'min_premium' => 75, 'max_premium' => 190, 'deductible_options' => [250, 500, 1000], 'coverage_options' => ['$50,000', '$100,000', '$250,000'], 'features' => ['Snapshot Discount', 'Multi-Car Discount', 'Pet Injury Coverage']],
                    ['name' => 'Progressive Home', 'insurance_type' => 'home', 'min_premium' => 90, 'max_premium' => 320, 'deductible_options' => [500, 1000, 2500], 'coverage_options' => ['$200,000', '$350,000', '$500,000'], 'features' => ['HomeQuote Explorer', 'Bundle Discount', 'Equipment Breakdown']],
                ],
            ],
            [
                'name' => 'Allstate',
                'slug' => 'allstate',
                'description' => 'You\'re in good hands with comprehensive coverage.',
                'am_best_rating' => 'A+',
                'states_available' => ['TX', 'CA', 'FL', 'NY', 'IL', 'PA', 'OH', 'GA'],
                'products' => [
                    ['name' => 'Allstate Auto', 'insurance_type' => 'auto', 'min_premium' => 85, 'max_premium' => 210, 'deductible_options' => [250, 500, 1000], 'coverage_options' => ['$50,000', '$100,000', '$300,000'], 'features' => ['Safe Driving Bonus', 'New Car Replacement', 'Deductible Rewards']],
                    ['name' => 'Allstate Life', 'insurance_type' => 'life', 'min_premium' => 30, 'max_premium' => 150, 'deductible_options' => [], 'coverage_options' => ['$100,000', '$250,000', '$500,000', '$1,000,000'], 'features' => ['Term & Whole Life', 'Living Benefits', 'Guaranteed Issue']],
                ],
            ],
            [
                'name' => 'USAA',
                'slug' => 'usaa',
                'description' => 'Top-rated insurance for military families.',
                'am_best_rating' => 'A++',
                'states_available' => ['TX', 'CA', 'FL', 'NY', 'IL', 'PA', 'OH', 'GA', 'NC', 'VA'],
                'products' => [
                    ['name' => 'USAA Auto', 'insurance_type' => 'auto', 'min_premium' => 65, 'max_premium' => 170, 'deductible_options' => [250, 500, 1000], 'coverage_options' => ['$50,000', '$100,000', '$300,000'], 'features' => ['Military Discount', 'Safe Pilot Discount', 'Accident Forgiveness']],
                    ['name' => 'USAA Renters', 'insurance_type' => 'renters', 'min_premium' => 12, 'max_premium' => 30, 'deductible_options' => [250, 500], 'coverage_options' => ['$25,000', '$50,000', '$100,000'], 'features' => ['Personal Property', 'Liability', 'Loss of Use']],
                ],
            ],
            [
                'name' => 'Liberty Mutual',
                'slug' => 'liberty-mutual',
                'description' => 'Customizable coverage for what matters most.',
                'am_best_rating' => 'A',
                'states_available' => ['TX', 'CA', 'FL', 'NY', 'IL', 'PA', 'OH'],
                'products' => [
                    ['name' => 'Liberty Auto', 'insurance_type' => 'auto', 'min_premium' => 82, 'max_premium' => 195, 'deductible_options' => [250, 500, 1000], 'coverage_options' => ['$50,000', '$100,000', '$250,000'], 'features' => ['New Car Replacement', 'Better Car Replacement', 'Lifetime Repair Guarantee']],
                    ['name' => 'Liberty Home', 'insurance_type' => 'home', 'min_premium' => 95, 'max_premium' => 340, 'deductible_options' => [500, 1000, 2500], 'coverage_options' => ['$200,000', '$350,000', '$500,000'], 'features' => ['Inflation Protection', 'Water Backup', 'Identity Theft']],
                ],
            ],
            [
                'name' => 'Nationwide',
                'slug' => 'nationwide',
                'description' => 'Nationwide is on your side with comprehensive plans.',
                'am_best_rating' => 'A+',
                'states_available' => ['TX', 'CA', 'FL', 'NY', 'IL', 'OH', 'PA'],
                'products' => [
                    ['name' => 'Nationwide Auto', 'insurance_type' => 'auto', 'min_premium' => 78, 'max_premium' => 185, 'deductible_options' => [250, 500, 1000], 'coverage_options' => ['$50,000', '$100,000', '$250,000'], 'features' => ['Vanishing Deductible', 'Accident Forgiveness', 'On Your Side Review']],
                    ['name' => 'Nationwide Business', 'insurance_type' => 'business', 'min_premium' => 150, 'max_premium' => 500, 'deductible_options' => [500, 1000, 2500, 5000], 'coverage_options' => ['$500,000', '$1,000,000', '$2,000,000'], 'features' => ['General Liability', 'Commercial Property', 'Workers Comp', 'BOP']],
                ],
            ],
            [
                'name' => 'Farmers Insurance',
                'slug' => 'farmers',
                'description' => 'We know a thing or two because we\'ve seen a thing or two.',
                'am_best_rating' => 'A',
                'states_available' => ['TX', 'CA', 'FL', 'NY', 'IL', 'OH'],
                'products' => [
                    ['name' => 'Farmers Auto', 'insurance_type' => 'auto', 'min_premium' => 88, 'max_premium' => 205, 'deductible_options' => [250, 500, 1000], 'coverage_options' => ['$50,000', '$100,000', '$300,000'], 'features' => ['Signal Discount', 'Multi-Policy Savings', 'New Car Pledge']],
                    ['name' => 'Farmers Umbrella', 'insurance_type' => 'umbrella', 'min_premium' => 20, 'max_premium' => 60, 'deductible_options' => [], 'coverage_options' => ['$1,000,000', '$2,000,000', '$5,000,000'], 'features' => ['Excess Liability', 'Personal Injury', 'Worldwide Coverage']],
                ],
            ],
            [
                'name' => 'MetLife',
                'slug' => 'metlife',
                'description' => 'Global insurance leader with comprehensive life products.',
                'am_best_rating' => 'A+',
                'states_available' => ['TX', 'CA', 'FL', 'NY', 'IL', 'PA', 'OH', 'GA', 'NC'],
                'products' => [
                    ['name' => 'MetLife Term Life', 'insurance_type' => 'life', 'min_premium' => 25, 'max_premium' => 120, 'deductible_options' => [], 'coverage_options' => ['$100,000', '$250,000', '$500,000', '$1,000,000'], 'features' => ['Level Premium', 'Conversion Option', 'Accelerated Benefits']],
                    ['name' => 'MetLife Health', 'insurance_type' => 'health', 'min_premium' => 200, 'max_premium' => 600, 'deductible_options' => [500, 1000, 2500, 5000], 'coverage_options' => ['Bronze', 'Silver', 'Gold', 'Platinum'], 'features' => ['Preventive Care', 'Prescription Coverage', 'Mental Health', 'Telehealth']],
                ],
            ],
            [
                'name' => 'Travelers',
                'slug' => 'travelers',
                'description' => 'Specializing in business and personal insurance.',
                'am_best_rating' => 'A++',
                'states_available' => ['TX', 'CA', 'FL', 'NY', 'IL', 'PA', 'OH', 'GA'],
                'products' => [
                    ['name' => 'Travelers Home', 'insurance_type' => 'home', 'min_premium' => 105, 'max_premium' => 380, 'deductible_options' => [500, 1000, 2500, 5000], 'coverage_options' => ['$200,000', '$400,000', '$600,000', '$1,000,000'], 'features' => ['Green Home Discount', 'Wildfire Defense', 'Cyber Coverage']],
                    ['name' => 'Travelers Business', 'insurance_type' => 'business', 'min_premium' => 175, 'max_premium' => 600, 'deductible_options' => [500, 1000, 2500, 5000], 'coverage_options' => ['$500,000', '$1,000,000', '$2,000,000', '$5,000,000'], 'features' => ['BOP', 'Professional Liability', 'Cyber Insurance', 'Commercial Auto']],
                ],
            ],
        ];

        foreach ($carriers as $carrierData) {
            $products = $carrierData['products'];
            unset($carrierData['products']);

            $carrier = Carrier::updateOrCreate(
                ['slug' => $carrierData['slug']],
                $carrierData
            );

            foreach ($products as $productData) {
                CarrierProduct::updateOrCreate(
                    ['carrier_id' => $carrier->id, 'name' => $productData['name']],
                    [...$productData, 'carrier_id' => $carrier->id]
                );
            }
        }
    }
}
