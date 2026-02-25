<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lead_marketplace_listings', function (Blueprint $table) {
            $table->enum('listing_type', ['fixed_price', 'auction'])->default('fixed_price')->after('asking_price');
            $table->decimal('min_bid', 10, 2)->nullable()->after('listing_type');
            $table->decimal('current_bid', 10, 2)->nullable()->after('min_bid');
            $table->foreignId('current_bidder_id')->nullable()->constrained('users')->nullOnDelete()->after('current_bid');
            $table->timestamp('auction_ends_at')->nullable()->after('current_bidder_id');
            $table->integer('bid_count')->default(0)->after('auction_ends_at');
            $table->decimal('suggested_price', 10, 2)->nullable()->after('bid_count');
        });

        Schema::create('lead_marketplace_bids', function (Blueprint $table) {
            $table->id();
            $table->foreignId('listing_id')->constrained('lead_marketplace_listings')->cascadeOnDelete();
            $table->foreignId('bidder_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            $table->boolean('is_winning')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_marketplace_bids');

        Schema::table('lead_marketplace_listings', function (Blueprint $table) {
            $table->dropForeign(['current_bidder_id']);
            $table->dropColumn([
                'listing_type', 'min_bid', 'current_bid', 'current_bidder_id',
                'auction_ends_at', 'bid_count', 'suggested_price',
            ]);
        });
    }
};
