<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quotes', function (Blueprint $table) {
            $table->string('carrier_name')->nullable()->change();
            $table->timestamp('expires_at')->nullable()->after('is_recommended');
        });
    }

    public function down(): void
    {
        Schema::table('quotes', function (Blueprint $table) {
            $table->string('carrier_name')->nullable(false)->change();
            $table->dropColumn('expires_at');
        });
    }
};
