<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rate_tables', function (Blueprint $table) {
            $table->text('description')->nullable()->after('name');
            $table->date('effective_date')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('rate_tables', function (Blueprint $table) {
            $table->dropColumn('description');
            $table->date('effective_date')->nullable(false)->change();
        });
    }
};
