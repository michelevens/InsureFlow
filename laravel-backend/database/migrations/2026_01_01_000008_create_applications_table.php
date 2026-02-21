<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        if (!Schema::hasTable('applications')) {
            Schema::create('applications', function (Blueprint $table) {
                $table->id();
                $table->string('reference')->unique();
                $table->foreignId('quote_id')->nullable()->constrained('quotes')->nullOnDelete();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('agent_id')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('carrier_product_id')->constrained('carrier_products')->cascadeOnDelete();
                $table->string('insurance_type');
                $table->string('carrier_name');
                $table->decimal('premium', 10, 2);
                $table->json('coverage_details')->nullable();
                $table->enum('status', ['draft','submitted','under_review','approved','declined','bound'])->default('draft');
                $table->json('documents')->nullable();
                $table->text('notes')->nullable();
                $table->timestamp('submitted_at')->nullable();
                $table->timestamp('reviewed_at')->nullable();
                $table->timestamps();
                $table->index('status');
                $table->index('user_id');
                $table->index('agent_id');
            });
        }
    }
    public function down(): void { Schema::dropIfExists('applications'); }
};
