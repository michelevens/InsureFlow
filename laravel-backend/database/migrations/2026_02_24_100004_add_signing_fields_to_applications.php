<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            $table->string('signing_token', 64)->nullable()->unique()->after('status');
            $table->string('signer_name')->nullable();
            $table->text('signature_data')->nullable(); // base64 canvas data
            $table->string('signer_ip', 45)->nullable();
            $table->timestamp('signed_at')->nullable();
            $table->index('signing_token');
        });
    }

    public function down(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            $table->dropIndex(['signing_token']);
            $table->dropColumn(['signing_token', 'signer_name', 'signature_data', 'signer_ip', 'signed_at']);
        });
    }
};
