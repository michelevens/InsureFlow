<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('api_keys', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('organization_id')->nullable()->constrained()->onDelete('set null');
            $table->string('name');
            $table->string('key_hash', 64)->unique();
            $table->string('key_prefix', 12); // first 12 chars for display: "ins_abc123..."
            $table->json('permissions')->nullable(); // ["read:policies", "write:applications"]
            $table->integer('rate_limit')->default(1000); // per hour
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('api_usage_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('api_key_id')->constrained()->onDelete('cascade');
            $table->string('endpoint');
            $table->string('method', 10);
            $table->integer('response_status');
            $table->integer('response_time_ms')->nullable();
            $table->string('ip_address')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('api_usage_logs');
        Schema::dropIfExists('api_keys');
    }
};
