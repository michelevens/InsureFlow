<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->morphs('documentable'); // application, policy, quote_request, insurance_profile
            $table->foreignId('uploaded_by')->constrained('users')->cascadeOnDelete();
            $table->string('type'); // application_form, dec_page, binder, coi, endorsement, id_document, proof_of_loss, other
            $table->string('title');
            $table->string('file_name');
            $table->string('file_path');
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('file_size')->default(0);
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['documentable_type', 'documentable_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
