<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('signatures', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->morphs('signable'); // application, document
            $table->string('signer_role'); // applicant, agent, carrier_rep, agency_owner
            $table->string('signer_name');
            $table->string('signer_email');
            $table->foreignId('signer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default('requested'); // requested, signed, rejected, cancelled
            $table->longText('signature_data')->nullable(); // base64 PNG from canvas
            $table->string('ip_address')->nullable();
            $table->string('user_agent')->nullable();
            $table->text('request_message')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamp('requested_at')->nullable();
            $table->timestamp('signed_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->timestamps();

            $table->index(['signable_type', 'signable_id', 'status']);
            $table->index('signer_email');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('signatures');
    }
};
