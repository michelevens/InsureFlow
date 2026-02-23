<?php

namespace App\Http\Controllers;

use App\Models\PlatformProduct;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductVisibilityController extends Controller
{
    /**
     * Public endpoint: get visible products.
     * No agency_id → all platform-active products.
     * With agency_id → intersection of platform-active AND agency-supported.
     */
    public function visible(Request $request): JsonResponse
    {
        $agencyId = $request->query('agency_id')
            ? (int) $request->query('agency_id')
            : null;

        $products = PlatformProduct::visibleProducts($agencyId);

        return response()->json([
            'products' => $products,
            'grouped' => $products->groupBy('category'),
        ]);
    }
}
