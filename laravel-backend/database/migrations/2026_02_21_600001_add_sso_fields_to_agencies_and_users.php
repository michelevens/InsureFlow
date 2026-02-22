<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('agencies', function (Blueprint $table) {
            $table->string('saml_entity_id')->nullable();
            $table->text('saml_sso_url')->nullable();
            $table->text('saml_certificate')->nullable();
            $table->boolean('sso_enabled')->default(false);
            $table->string('sso_default_role')->default('agent');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('sso_provider')->nullable();
            $table->string('sso_id')->nullable();

            $table->index('sso_id');
        });
    }

    public function down(): void
    {
        Schema::table('agencies', function (Blueprint $table) {
            $table->dropColumn(['saml_entity_id', 'saml_sso_url', 'saml_certificate', 'sso_enabled', 'sso_default_role']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['sso_id']);
            $table->dropColumn(['sso_provider', 'sso_id']);
        });
    }
};
