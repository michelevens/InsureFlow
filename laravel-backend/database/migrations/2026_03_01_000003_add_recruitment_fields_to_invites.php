<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invites', function (Blueprint $table) {
            $table->string('agency_name')->nullable()->after('role');
            $table->string('contact_name')->nullable()->after('agency_name');
            $table->text('custom_message')->nullable()->after('contact_name');
            // Tracking fields
            $table->timestamp('email_opened_at')->nullable()->after('accepted_at');
            $table->timestamp('link_clicked_at')->nullable()->after('email_opened_at');
            $table->unsignedSmallInteger('open_count')->default(0)->after('link_clicked_at');
            $table->unsignedSmallInteger('click_count')->default(0)->after('open_count');
        });
    }

    public function down(): void
    {
        Schema::table('invites', function (Blueprint $table) {
            $table->dropColumn(['agency_name', 'contact_name', 'custom_message', 'email_opened_at', 'link_clicked_at', 'open_count', 'click_count']);
        });
    }
};
