<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        if (!Schema::hasTable('agent_reviews')) {
            Schema::create('agent_reviews', function (Blueprint $table) {
                $table->id();
                $table->foreignId('agent_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->integer('rating');
                $table->text('comment')->nullable();
                $table->text('agent_reply')->nullable();
                $table->timestamp('reply_at')->nullable();
                $table->timestamps();
                $table->unique(['agent_id', 'user_id']);
                $table->index('agent_id');
            });
        }
    }
    public function down(): void { Schema::dropIfExists('agent_reviews'); }
};
