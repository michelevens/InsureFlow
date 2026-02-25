<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('white_label_configs', function (Blueprint $table) {
            $table->foreignId('agency_id')->nullable()->after('organization_id')->constrained()->onDelete('cascade');
            // Make organization_id nullable so configs can belong to an agency instead
            $table->foreignId('organization_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('white_label_configs', function (Blueprint $table) {
            $table->dropForeign(['agency_id']);
            $table->dropColumn('agency_id');
        });
    }
};
