<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quote_requests', function (Blueprint $table) {
            $table->boolean('is_marketplace')->default(false)->after('status');
            $table->string('state', 2)->nullable()->after('zip_code');
            $table->text('description')->nullable()->after('details');
            $table->timestamp('expires_at')->nullable();
            $table->index(['is_marketplace', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('quote_requests', function (Blueprint $table) {
            $table->dropIndex(['is_marketplace', 'status']);
            $table->dropColumn(['is_marketplace', 'state', 'description', 'expires_at']);
        });
    }
};
