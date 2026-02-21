<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        if (!Schema::hasTable('policies')) {
            Schema::create('policies', function (Blueprint $table) {
                $table->id();
                $table->string('policy_number')->unique();
                $table->foreignId('application_id')->nullable()->constrained('applications')->nullOnDelete();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('agent_id')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('carrier_product_id')->constrained('carrier_products')->cascadeOnDelete();
                $table->string('type');
                $table->string('carrier_name');
                $table->decimal('monthly_premium', 10, 2);
                $table->decimal('annual_premium', 10, 2);
                $table->decimal('deductible', 10, 2)->nullable();
                $table->string('coverage_limit')->nullable();
                $table->json('coverage_details')->nullable();
                $table->enum('status', ['active','expiring_soon','expired','cancelled'])->default('active');
                $table->date('effective_date');
                $table->date('expiration_date');
                $table->timestamps();
                $table->index('status');
                $table->index('user_id');
                $table->index('expiration_date');
            });
        }
    }
    public function down(): void { Schema::dropIfExists('policies'); }
};
