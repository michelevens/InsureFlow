<?php

namespace Database\Factories;

use App\Models\EmbedPartner;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class EmbedPartnerFactory extends Factory
{
    protected $model = EmbedPartner::class;

    public function definition(): array
    {
        return [
            'name' => fake()->company(),
            'api_key' => 'emb_' . Str::random(48),
            'allowed_domains' => [fake()->domainName()],
            'commission_share_percent' => 10.00,
            'contact_email' => fake()->email(),
            'contact_name' => fake()->name(),
            'is_active' => true,
            'widget_config' => [],
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }
}
