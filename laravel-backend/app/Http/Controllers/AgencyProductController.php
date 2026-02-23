<?php

namespace App\Http\Controllers;

use App\Models\Agency;
use App\Models\AgencyCarrierAppointment;
use App\Models\PlatformProduct;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AgencyProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $agencyId = $request->attributes->get('agency_id');
        if (!$agencyId) {
            return response()->json(['error' => 'No agency context'], 403);
        }

        $agency = Agency::findOrFail($agencyId);
        $platformProducts = PlatformProduct::active()->orderBy('sort_order')->get();
        $agencyProductIds = $agency->platformProducts()
            ->wherePivot('is_active', true)
            ->pluck('platform_products.id')
            ->toArray();

        $products = $platformProducts->map(fn($p) => [
            ...$p->toArray(),
            'agency_enabled' => in_array($p->id, $agencyProductIds),
        ]);

        return response()->json([
            'products' => $products,
            'grouped' => $products->groupBy('category'),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $agencyId = $request->attributes->get('agency_id');
        if (!$agencyId) {
            return response()->json(['error' => 'No agency context'], 403);
        }

        $data = $request->validate([
            'product_ids' => 'required|array',
            'product_ids.*' => 'integer|exists:platform_products,id',
        ]);

        $agency = Agency::findOrFail($agencyId);

        $syncData = [];
        foreach ($data['product_ids'] as $id) {
            $syncData[$id] = ['is_active' => true];
        }
        $agency->platformProducts()->sync($syncData);

        return response()->json(['message' => 'Agency products updated']);
    }

    public function toggleProduct(Request $request, PlatformProduct $product): JsonResponse
    {
        $agencyId = $request->attributes->get('agency_id');
        if (!$agencyId) {
            return response()->json(['error' => 'No agency context'], 403);
        }

        $agency = Agency::findOrFail($agencyId);
        $existing = $agency->platformProducts()->where('platform_products.id', $product->id)->first();

        if ($existing) {
            $agency->platformProducts()->updateExistingPivot($product->id, [
                'is_active' => !$existing->pivot->is_active,
            ]);
            $nowActive = !$existing->pivot->is_active;
        } else {
            $agency->platformProducts()->attach($product->id, ['is_active' => true]);
            $nowActive = true;
        }

        return response()->json([
            'message' => $nowActive ? 'Product enabled' : 'Product disabled',
            'is_active' => $nowActive,
        ]);
    }

    // ── Carrier Appointments ──────────────────────────

    public function appointments(Request $request): JsonResponse
    {
        $agencyId = $request->attributes->get('agency_id');
        if (!$agencyId) {
            return response()->json(['error' => 'No agency context'], 403);
        }

        $appointments = AgencyCarrierAppointment::where('agency_id', $agencyId)
            ->with(['carrier', 'platformProduct'])
            ->orderBy('carrier_id')
            ->get();

        return response()->json($appointments);
    }

    public function storeAppointment(Request $request): JsonResponse
    {
        $agencyId = $request->attributes->get('agency_id');
        if (!$agencyId) {
            return response()->json(['error' => 'No agency context'], 403);
        }

        $data = $request->validate([
            'carrier_id' => 'required|exists:carriers,id',
            'platform_product_id' => 'required|exists:platform_products,id',
            'appointment_number' => 'nullable|string|max:100',
            'effective_date' => 'nullable|date',
            'termination_date' => 'nullable|date|after_or_equal:effective_date',
            'is_active' => 'sometimes|boolean',
        ]);

        $appointment = AgencyCarrierAppointment::updateOrCreate(
            [
                'agency_id' => $agencyId,
                'carrier_id' => $data['carrier_id'],
                'platform_product_id' => $data['platform_product_id'],
            ],
            [...$data, 'agency_id' => $agencyId]
        );

        $appointment->load(['carrier', 'platformProduct']);

        return response()->json($appointment, 201);
    }

    public function syncCarrierAppointments(Request $request, int $carrierId): JsonResponse
    {
        $agencyId = $request->attributes->get('agency_id');
        if (!$agencyId) {
            return response()->json(['error' => 'No agency context'], 403);
        }

        $data = $request->validate([
            'product_ids' => 'required|array',
            'product_ids.*' => 'integer|exists:platform_products,id',
        ]);

        AgencyCarrierAppointment::where('agency_id', $agencyId)
            ->where('carrier_id', $carrierId)
            ->update(['is_active' => false]);

        foreach ($data['product_ids'] as $productId) {
            AgencyCarrierAppointment::updateOrCreate(
                ['agency_id' => $agencyId, 'carrier_id' => $carrierId, 'platform_product_id' => $productId],
                ['is_active' => true]
            );
        }

        return response()->json(['message' => 'Carrier appointments updated']);
    }

    public function destroyAppointment(Request $request, AgencyCarrierAppointment $appointment): JsonResponse
    {
        $agencyId = $request->attributes->get('agency_id');
        if ((int) $appointment->agency_id !== (int) $agencyId) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $appointment->delete();

        return response()->json(['message' => 'Appointment removed']);
    }
}
