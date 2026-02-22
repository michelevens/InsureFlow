<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('generated_documents', function (Blueprint $table) {
            $table->id();
            $table->morphs('documentable'); // polymorphic (quote, application, policy, claim)
            $table->enum('template_type', [
                'quote_comparison', 'proposal', 'binder_letter', 'certificate_of_insurance',
                'dec_page', 'endorsement', 'cancellation_notice', 'renewal_offer', 'invoice',
            ]);
            $table->string('file_path');
            $table->string('file_name');
            $table->unsignedInteger('file_size')->nullable();
            $table->json('metadata')->nullable();
            $table->foreignId('generated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('generated_documents');
    }
};
