<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        if (!Schema::hasTable('carrier_products')) {
            Schema::create('carrier_products', function (Blueprint $table) {
                $table->id();
                $table->foreignId('carrier_id')->constrained('carriers')->cascadeOnDelete();
                $table->string('name');
                $table->enum('insurance_type', ['auto','home','life','health','renters','business','umbrella']);
                $table->text('description')->nullable();
                $table->decimal('min_premium', 10, 2)->nullable();
                $table->decimal('max_premium', 10, 2)->nullable();
                $table->json('deductible_options')->nullable();
                $table->json('coverage_options')->nullable();
                $table->json('features')->nullable();
                $table->json('states_available')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
                $table->index('insurance_type');
                $table->index('is_active');
            });
        }
    }
    public function down(): void { Schema::dropIfExists('carrier_products'); }
};
