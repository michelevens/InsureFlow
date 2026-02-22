<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('data_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('product_type', ['market_intel', 'competitive_analysis', 'agent_benchmarking', 'custom_reports']);
            $table->enum('tier', ['basic', 'professional', 'enterprise'])->default('basic');
            $table->decimal('price_monthly', 10, 2);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('data_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('data_subscription_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('report_type');
            $table->string('title');
            $table->string('file_path')->nullable();
            $table->json('parameters')->nullable();
            $table->json('results')->nullable();
            $table->enum('status', ['pending', 'generating', 'completed', 'failed'])->default('pending');
            $table->timestamps();
        });

        Schema::create('market_data_cache', function (Blueprint $table) {
            $table->id();
            $table->string('dimension'); // state, insurance_type, carrier, etc.
            $table->string('key');
            $table->json('metrics');
            $table->string('period'); // 2026-Q1, 2026-01, etc.
            $table->timestamps();

            $table->unique(['dimension', 'key', 'period']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('market_data_cache');
        Schema::dropIfExists('data_reports');
        Schema::dropIfExists('data_subscriptions');
    }
};
