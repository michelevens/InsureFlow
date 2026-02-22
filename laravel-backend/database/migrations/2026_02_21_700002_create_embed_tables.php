<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('embed_partners', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('api_key', 64)->unique();
            $table->json('allowed_domains')->nullable(); // ["dealer.com", "mortgage.co"]
            $table->decimal('commission_share_percent', 5, 2)->default(10.00);
            $table->string('contact_email')->nullable();
            $table->string('contact_name')->nullable();
            $table->boolean('is_active')->default(true);
            $table->json('widget_config')->nullable(); // theme, insurance_types, default_values
            $table->timestamps();
        });

        Schema::create('embed_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('embed_partner_id')->constrained('embed_partners')->onDelete('cascade');
            $table->string('source_domain')->nullable();
            $table->string('insurance_type')->nullable();
            $table->string('session_token', 64)->unique();
            $table->json('quote_data')->nullable();
            $table->foreignId('quote_request_id')->nullable()->constrained('quote_requests')->onDelete('set null');
            $table->timestamp('converted_at')->nullable();
            $table->string('ip_address')->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('embed_sessions');
        Schema::dropIfExists('embed_partners');
    }
};
