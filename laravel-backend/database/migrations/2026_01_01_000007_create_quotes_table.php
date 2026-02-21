<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        if (!Schema::hasTable('quotes')) {
            Schema::create('quotes', function (Blueprint $table) {
                $table->id();
                $table->foreignId('quote_request_id')->constrained('quote_requests')->cascadeOnDelete();
                $table->foreignId('carrier_product_id')->constrained('carrier_products')->cascadeOnDelete();
                $table->string('carrier_name');
                $table->decimal('monthly_premium', 10, 2);
                $table->decimal('annual_premium', 10, 2);
                $table->decimal('deductible', 10, 2)->nullable();
                $table->string('coverage_limit')->nullable();
                $table->json('features')->nullable();
                $table->decimal('rating', 3, 2)->nullable();
                $table->boolean('is_recommended')->default(false);
                $table->timestamps();
                $table->index('quote_request_id');
            });
        }
    }
    public function down(): void { Schema::dropIfExists('quotes'); }
};
