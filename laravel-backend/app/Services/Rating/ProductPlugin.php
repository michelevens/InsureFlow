<?php

namespace App\Services\Rating;

/**
 * Every insurance product is implemented as a plugin, not as core logic.
 *
 * Each plugin provides:
 *  - eligibility rules
 *  - exposure calculator
 *  - rate key builder
 *  - factor registry
 *  - rider registry
 *  - fee/credit handlers
 *
 * Core engine must NOT branch on product family.
 * Only plugin resolution by productType is allowed.
 */
interface ProductPlugin
{
    /**
     * Which product types this plugin handles.
     * @return string[]
     */
    public static function productTypes(): array;

    /**
     * Rate the product. This is the single entry point.
     */
    public function rateProduct(RateInput $input): RateOutput;
}
