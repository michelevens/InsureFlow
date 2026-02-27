<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('embed_partners', function (Blueprint $table) {
            $table->foreignId('agency_id')->nullable()->after('name')
                ->constrained('agencies')->onDelete('set null');
            $table->string('embed_type', 30)->default('quote')->after('agency_id'); // quote | team_signup
        });
    }

    public function down(): void
    {
        Schema::table('embed_partners', function (Blueprint $table) {
            $table->dropForeign(['agency_id']);
            $table->dropColumn(['agency_id', 'embed_type']);
        });
    }
};
