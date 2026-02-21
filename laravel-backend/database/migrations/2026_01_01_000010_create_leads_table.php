<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        if (!Schema::hasTable('leads')) {
            Schema::create('leads', function (Blueprint $table) {
                $table->id();
                $table->foreignId('agent_id')->constrained('users')->cascadeOnDelete();
                $table->string('first_name');
                $table->string('last_name');
                $table->string('email');
                $table->string('phone')->nullable();
                $table->string('insurance_type');
                $table->enum('status', ['new','contacted','quoted','applied','won','lost'])->default('new');
                $table->string('source')->nullable();
                $table->decimal('estimated_value', 10, 2)->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();
                $table->index('agent_id');
                $table->index('status');
            });
        }
    }
    public function down(): void { Schema::dropIfExists('leads'); }
};
