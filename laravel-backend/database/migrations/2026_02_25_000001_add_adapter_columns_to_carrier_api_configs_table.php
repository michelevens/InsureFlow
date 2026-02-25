<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add adapter-layer columns to the existing carrier_api_configs table.
 *
 * The original table had: carrier_id, api_type, base_url, auth_type,
 * credentials_encrypted, field_mapping, rate_limit_per_minute, timeout_seconds,
 * is_active, last_tested_at.
 *
 * This migration adds: adapter_type, api_key (encrypted), api_secret (encrypted),
 * auth_config, field_mappings (alongside existing field_mapping for backward compat),
 * endpoints, headers, supported_products, sandbox_mode, sandbox_url, last_test_status.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('carrier_api_configs', function (Blueprint $table) {
            // Adapter type identifier (generic_rest, progressive, travelers, etc.)
            $table->string('adapter_type')->default('generic_rest')->after('auth_type');

            // Dedicated encrypted credential fields (in addition to legacy credentials_encrypted)
            $table->text('api_key')->nullable()->after('adapter_type');
            $table->text('api_secret')->nullable()->after('api_key');

            // Structured auth config (OAuth URLs, cert paths, extra auth params)
            $table->json('auth_config')->nullable()->after('api_secret');

            // New field_mappings column (JSON) — the existing field_mapping column is kept
            // for backward compatibility; adapters check both
            $table->json('field_mappings')->nullable()->after('field_mapping');

            // Configurable API endpoint paths
            $table->json('endpoints')->nullable()->after('field_mappings');

            // Additional custom headers
            $table->json('headers')->nullable()->after('endpoints');

            // Products this carrier config supports
            $table->json('supported_products')->nullable()->after('headers');

            // Sandbox mode toggle and separate sandbox URL
            $table->boolean('sandbox_mode')->default(true)->after('is_active');
            $table->string('sandbox_url')->nullable()->after('sandbox_mode');

            // Test status tracking
            $table->string('last_test_status')->nullable()->after('last_tested_at');
        });
    }

    public function down(): void
    {
        Schema::table('carrier_api_configs', function (Blueprint $table) {
            $table->dropColumn([
                'adapter_type',
                'api_key',
                'api_secret',
                'auth_config',
                'field_mappings',
                'endpoints',
                'headers',
                'supported_products',
                'sandbox_mode',
                'sandbox_url',
                'last_test_status',
            ]);
        });
    }
};
