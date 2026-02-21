<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        if (!Schema::hasTable('commissions')) {
            Schema::create('commissions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('agent_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('policy_id')->constrained('policies')->cascadeOnDelete();
                $table->string('carrier_name');
                $table->decimal('premium_amount', 10, 2);
                $table->decimal('commission_rate', 5, 2);
                $table->decimal('commission_amount', 10, 2);
                $table->enum('status', ['pending','paid','cancelled'])->default('pending');
                $table->date('paid_at')->nullable();
                $table->timestamps();
                $table->index('agent_id');
                $table->index('status');
            });
        }
    }
    public function down(): void { Schema::dropIfExists('commissions'); }
};
