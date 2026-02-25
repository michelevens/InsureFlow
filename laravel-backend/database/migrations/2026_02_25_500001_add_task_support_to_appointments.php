<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Add 'task' to type enum
        DB::statement("ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_type_check");
        DB::statement("ALTER TABLE appointments ALTER COLUMN type TYPE varchar(50)");
        DB::statement("ALTER TABLE appointments ADD CONSTRAINT appointments_type_check CHECK (type IN ('consultation','review','follow_up','claim','renewal','other','task'))");

        Schema::table('appointments', function (Blueprint $table) {
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium')->after('type');
            $table->timestamp('completed_at')->nullable()->after('status');
            $table->unsignedBigInteger('assigned_by')->nullable()->after('agent_id');

            $table->foreign('assigned_by')->references('id')->on('users')->nullOnDelete();
            $table->index(['agent_id', 'type', 'status'], 'idx_tasks_agent_type_status');
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropIndex('idx_tasks_agent_type_status');
            $table->dropForeign(['assigned_by']);
            $table->dropColumn(['priority', 'completed_at', 'assigned_by']);
        });

        DB::statement("ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_type_check");
        DB::statement("ALTER TABLE appointments ALTER COLUMN type TYPE varchar(255)");
        DB::statement("ALTER TABLE appointments ADD CONSTRAINT appointments_type_check CHECK (type IN ('consultation','review','follow_up','claim','renewal','other'))");
    }
};
