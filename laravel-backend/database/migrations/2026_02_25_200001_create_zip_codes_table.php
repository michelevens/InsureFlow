<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('zip_codes', function (Blueprint $table) {
            $table->id();
            $table->string('zip', 5)->index();
            $table->string('city', 100);
            $table->string('state', 2)->index();
            $table->string('county', 100)->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->string('timezone', 50)->nullable();
            $table->timestamps();

            $table->unique(['zip', 'city', 'state']);
            $table->index(['city', 'state']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('zip_codes');
    }
};
