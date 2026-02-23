<?php

namespace App\Http\Controllers;

use App\Models\PlatformProduct;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = PlatformProduct::query();

        if ($category = $request->query('category')) {
            $query->where('category', $category);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('slug', 'ilike', "%{$search}%");
            });
        }

        $products = $query->orderBy('sort_order')->get();
        $grouped = $products->groupBy('category');

        return response()->json([
            'products' => $products,
            'grouped' => $grouped,
            'categories' => $grouped->keys(),
            'active_count' => $products->where('is_active', true)->count(),
            'total_count' => $products->count(),
        ]);
    }

    public function toggle(PlatformProduct $product): JsonResponse
    {
        $product->update(['is_active' => !$product->is_active]);

        return response()->json([
            'message' => $product->is_active ? 'Product activated' : 'Product deactivated',
            'product' => $product,
        ]);
    }

    public function update(Request $request, PlatformProduct $product): JsonResponse
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'icon' => 'sometimes|string|max:50',
            'sort_order' => 'sometimes|integer',
            'is_active' => 'sometimes|boolean',
        ]);

        $product->update($data);

        return response()->json($product);
    }

    public function bulkToggle(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_ids' => 'required|array',
            'product_ids.*' => 'integer|exists:platform_products,id',
            'is_active' => 'required|boolean',
        ]);

        PlatformProduct::whereIn('id', $data['product_ids'])
            ->update(['is_active' => $data['is_active']]);

        return response()->json(['message' => 'Products updated']);
    }

    public function sync(): JsonResponse
    {
        \Artisan::call('db:seed', ['--class' => 'PlatformProductSeeder', '--force' => true]);

        return response()->json(['message' => 'Products synced from registry']);
    }
}
