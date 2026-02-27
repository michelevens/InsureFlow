<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('carriers', function (Blueprint $table) {
            // Industry identifiers
            $table->string('naic_code', 10)->nullable()->unique()->after('slug');
            $table->string('naic_group_code', 10)->nullable()->after('naic_code');
            $table->string('domicile_state', 2)->nullable()->after('naic_group_code');

            // Financial strength
            $table->string('sp_rating', 10)->nullable()->after('am_best_rating');
            $table->string('am_best_financial_size', 10)->nullable()->after('sp_rating');
            $table->integer('year_founded')->nullable()->after('am_best_financial_size');

            // Complaint & market data
            $table->decimal('naic_complaint_ratio', 5, 2)->nullable()->after('year_founded');
            $table->string('market_segment', 50)->nullable()->after('naic_complaint_ratio');

            // Lines of business
            $table->json('lines_of_business')->nullable()->after('market_segment');

            // Headquarters
            $table->string('headquarters_city', 100)->nullable()->after('lines_of_business');
            $table->string('headquarters_state', 2)->nullable()->after('headquarters_city');

            // Financial & operational
            $table->decimal('total_premium_written', 15, 2)->nullable()->after('headquarters_state');
            $table->boolean('is_admitted')->default(true)->after('total_premium_written');
            $table->string('distribution_model', 50)->nullable()->after('is_admitted');
            $table->json('carrier_metadata')->nullable()->after('distribution_model');

            // Indexes
            $table->index('market_segment');
            $table->index('domicile_state');
        });
    }

    public function down(): void
    {
        Schema::table('carriers', function (Blueprint $table) {
            $table->dropIndex(['market_segment']);
            $table->dropIndex(['domicile_state']);
            $table->dropUnique(['naic_code']);

            $table->dropColumn([
                'naic_code', 'naic_group_code', 'domicile_state',
                'sp_rating', 'am_best_financial_size', 'year_founded',
                'naic_complaint_ratio', 'market_segment', 'lines_of_business',
                'headquarters_city', 'headquarters_state',
                'total_premium_written', 'is_admitted', 'distribution_model',
                'carrier_metadata',
            ]);
        });
    }
};
