<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        if (!Schema::hasTable('quote_requests')) {
            Schema::create('quote_requests', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('insurance_type');
                $table->string('zip_code', 10);
                $table->enum('coverage_level', ['basic','standard','premium'])->default('standard');
                $table->json('details')->nullable();
                $table->string('first_name');
                $table->string('last_name');
                $table->string('email');
                $table->string('phone')->nullable();
                $table->date('date_of_birth')->nullable();
                $table->enum('status', ['pending','completed'])->default('pending');
                $table->timestamps();
                $table->index(['insurance_type', 'status']);
                $table->index('email');
            });
        }
    }
    public function down(): void { Schema::dropIfExists('quote_requests'); }
};
