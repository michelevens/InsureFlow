<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agency_carrier_appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agency_id')->constrained('agencies')->cascadeOnDelete();
            $table->foreignId('carrier_id')->constrained('carriers')->cascadeOnDelete();
            $table->foreignId('platform_product_id')->constrained('platform_products')->cascadeOnDelete();
            $table->string('appointment_number', 100)->nullable();
            $table->date('effective_date')->nullable();
            $table->date('termination_date')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(
                ['agency_id', 'carrier_id', 'platform_product_id'],
                'aca_agency_carrier_product_unique'
            );
            $table->index('agency_id');
            $table->index(['agency_id', 'platform_product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agency_carrier_appointments');
    }
};
