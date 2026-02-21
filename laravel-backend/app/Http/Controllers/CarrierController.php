<?php

namespace App\Http\Controllers;

use App\Models\Carrier;
use App\Models\CarrierProduct;
use Illuminate\Http\Request;

class CarrierController extends Controller
{
    public function index()
    {
        $carriers = Carrier::where('is_active', true)
            ->withCount('products')
            ->orderBy('name')
            ->get();

        return response()->json($carriers);
    }

    public function show(Carrier $carrier)
    {
        $carrier->load('products');
        return response()->json($carrier);
    }

    public function products(Request $request)
    {
        $query = CarrierProduct::with('carrier');

        if ($type = $request->query('type')) {
            $query->where('insurance_type', $type);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhereHas('carrier', function ($cq) use ($search) {
                      $cq->where('name', 'ilike', "%{$search}%");
                  });
            });
        }

        $products = $query->orderBy('name')->paginate(20);

        return response()->json($products);
    }

    public function storeProduct(Request $request)
    {
        $data = $request->validate([
            'carrier_id' => 'required|exists:carriers,id',
            'name' => 'required|string|max:255',
            'insurance_type' => 'required|in:auto,home,life,health,renters,business,umbrella',
            'description' => 'nullable|string',
            'min_premium' => 'required|numeric|min:0',
            'max_premium' => 'required|numeric|min:0',
            'deductible_options' => 'nullable|array',
            'coverage_options' => 'nullable|array',
            'features' => 'nullable|array',
            'states_available' => 'nullable|array',
            'is_active' => 'sometimes|boolean',
        ]);

        $product = CarrierProduct::create($data);
        return response()->json($product, 201);
    }

    public function updateProduct(Request $request, CarrierProduct $product)
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'min_premium' => 'sometimes|numeric|min:0',
            'max_premium' => 'sometimes|numeric|min:0',
            'deductible_options' => 'nullable|array',
            'coverage_options' => 'nullable|array',
            'features' => 'nullable|array',
            'states_available' => 'nullable|array',
            'is_active' => 'sometimes|boolean',
        ]);

        $product->update($data);
        return response()->json($product);
    }

    public function production(Request $request)
    {
        $products = CarrierProduct::with('carrier')
            ->withCount([
                'applications',
                'applications as bound_count' => function ($q) {
                    $q->where('status', 'bound');
                },
            ])
            ->get()
            ->map(function ($product) {
                $product->bind_rate = $product->applications_count > 0
                    ? round(($product->bound_count / $product->applications_count) * 100, 1)
                    : 0;
                return $product;
            });

        return response()->json($products);
    }
}
