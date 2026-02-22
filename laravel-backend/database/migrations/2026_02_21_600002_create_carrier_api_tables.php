<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('carrier_api_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('carrier_id')->constrained()->onDelete('cascade');
            $table->enum('api_type', ['rest', 'soap', 'xml']);
            $table->string('base_url');
            $table->enum('auth_type', ['api_key', 'oauth2', 'basic', 'certificate']);
            $table->text('credentials_encrypted')->nullable();
            $table->json('field_mapping')->nullable();
            $table->integer('rate_limit_per_minute')->default(60);
            $table->integer('timeout_seconds')->default(30);
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_tested_at')->nullable();
            $table->timestamps();

            $table->index(['carrier_id', 'is_active']);
        });

        Schema::create('carrier_api_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('carrier_api_config_id')->constrained('carrier_api_configs')->onDelete('cascade');
            $table->string('request_hash')->index();
            $table->string('request_method');
            $table->text('request_url');
            $table->json('request_payload')->nullable();
            $table->integer('response_status')->nullable();
            $table->text('response_body')->nullable();
            $table->integer('response_time_ms')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['carrier_api_config_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('carrier_api_logs');
        Schema::dropIfExists('carrier_api_configs');
    }
};
