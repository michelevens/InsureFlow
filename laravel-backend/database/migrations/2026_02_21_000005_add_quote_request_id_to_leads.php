<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->foreignId('agent_id')->nullable()->change();
            $table->foreignId('quote_request_id')->nullable()->after('agent_id')
                ->constrained('quote_requests')->nullOnDelete();
            $table->foreignId('consumer_id')->nullable()->after('quote_request_id')
                ->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropForeign(['quote_request_id']);
            $table->dropColumn('quote_request_id');
            $table->dropForeign(['consumer_id']);
            $table->dropColumn('consumer_id');
        });
    }
};
