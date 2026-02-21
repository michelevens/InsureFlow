<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        if (!Schema::hasTable('agencies')) {
            Schema::create('agencies', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('slug')->unique();
                $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
                $table->text('description')->nullable();
                $table->string('phone')->nullable();
                $table->string('email')->nullable();
                $table->string('website')->nullable();
                $table->string('address')->nullable();
                $table->string('city')->nullable();
                $table->string('state', 2)->nullable();
                $table->string('zip_code', 10)->nullable();
                $table->string('logo')->nullable();
                $table->boolean('is_verified')->default(false);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
                $table->index(['is_verified', 'is_active']);
            });
        }
    }
    public function down(): void { Schema::dropIfExists('agencies'); }
};
