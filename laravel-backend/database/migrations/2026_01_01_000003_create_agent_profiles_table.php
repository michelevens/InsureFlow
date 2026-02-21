<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        if (!Schema::hasTable('agent_profiles')) {
            Schema::create('agent_profiles', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
                $table->foreignId('agency_id')->nullable()->constrained('agencies')->nullOnDelete();
                $table->text('bio')->nullable();
                $table->string('license_number')->nullable();
                $table->json('license_states')->nullable();
                $table->unsignedInteger('years_experience')->default(0);
                $table->json('specialties')->nullable();
                $table->json('carriers')->nullable();
                $table->string('response_time')->nullable();
                $table->unsignedInteger('clients_served')->default(0);
                $table->boolean('is_verified')->default(false);
                $table->decimal('avg_rating', 3, 2)->default(0);
                $table->unsignedInteger('review_count')->default(0);
                $table->timestamps();
                $table->index('is_verified');
                $table->index('avg_rating');
            });
        }
    }
    public function down(): void { Schema::dropIfExists('agent_profiles'); }
};
