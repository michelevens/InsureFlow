<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('white_label_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->onDelete('cascade');
            $table->string('domain')->nullable()->unique();
            $table->string('brand_name');
            $table->string('logo_url')->nullable();
            $table->string('favicon_url')->nullable();
            $table->string('primary_color', 7)->default('#1e40af');
            $table->string('secondary_color', 7)->default('#f59e0b');
            $table->text('custom_css')->nullable();
            $table->json('branding')->nullable(); // extended branding: tagline, footer_text, social_links
            $table->boolean('is_active')->default(false);
            $table->timestamps();
        });

        Schema::create('white_label_domains', function (Blueprint $table) {
            $table->id();
            $table->foreignId('white_label_config_id')->constrained()->onDelete('cascade');
            $table->string('domain')->unique();
            $table->enum('ssl_status', ['pending', 'provisioning', 'active', 'failed'])->default('pending');
            $table->timestamp('verified_at')->nullable();
            $table->string('txt_record')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('white_label_domains');
        Schema::dropIfExists('white_label_configs');
    }
};
