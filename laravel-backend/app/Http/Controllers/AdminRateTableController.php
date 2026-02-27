<?php

namespace App\Http\Controllers;

use App\Models\Carrier;
use App\Models\RateFactor;
use App\Models\RateFee;
use App\Models\RateModalFactor;
use App\Models\RateRider;
use App\Models\RateTable;
use App\Models\RateTableEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminRateTableController extends Controller
{
    // ── Rate Table CRUD ──────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $query = RateTable::with('carrier:id,name,slug')
            ->withCount('entries');

        if ($request->filled('product_type') && $request->product_type !== 'all') {
            $query->where('product_type', $request->product_type);
        }
        if ($request->filled('carrier_id')) {
            $query->where('carrier_id', $request->carrier_id);
        }
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('version', 'ilike', "%{$search}%");
            });
        }

        $rateTables = $query->orderBy('product_type')
            ->orderBy('carrier_id')
            ->orderByDesc('effective_date')
            ->get();

        return response()->json([
            'rate_tables' => $rateTables,
            'counts' => [
                'total' => RateTable::count(),
                'active' => RateTable::where('is_active', true)->count(),
                'ltc' => RateTable::where('product_type', 'long_term_care')->count(),
                'ltd' => RateTable::where('product_type', 'disability_ltd')->count(),
            ],
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $table = RateTable::with([
            'carrier:id,name,slug',
            'entries' => fn ($q) => $q->orderBy('rate_key'),
            'factors' => fn ($q) => $q->orderBy('factor_code')->orderBy('sort_order'),
            'riders' => fn ($q) => $q->orderBy('sort_order'),
            'fees' => fn ($q) => $q->orderBy('sort_order'),
            'modalFactors' => fn ($q) => $q->orderByRaw("CASE mode WHEN 'annual' THEN 1 WHEN 'semiannual' THEN 2 WHEN 'quarterly' THEN 3 WHEN 'monthly' THEN 4 END"),
        ])->withCount('entries')->findOrFail($id);

        return response()->json(['rate_table' => $table]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_type' => 'required|string|max:60',
            'version' => 'required|string|max:20',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'carrier_id' => 'nullable|integer|exists:carriers,id',
            'effective_date' => 'nullable|date',
            'expiration_date' => 'nullable|date',
            'is_active' => 'boolean',
            'metadata' => 'nullable|array',
        ]);

        $table = RateTable::create($data);

        return response()->json([
            'message' => 'Rate table created',
            'rate_table' => $table->load('carrier:id,name,slug'),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $table = RateTable::findOrFail($id);

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'sometimes|nullable|string|max:1000',
            'carrier_id' => 'nullable|integer|exists:carriers,id',
            'effective_date' => 'sometimes|nullable|date',
            'expiration_date' => 'sometimes|nullable|date',
            'is_active' => 'sometimes|boolean',
            'metadata' => 'sometimes|nullable|array',
        ]);

        $table->update($data);

        return response()->json([
            'message' => 'Rate table updated',
            'rate_table' => $table->fresh()->load('carrier:id,name,slug'),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $table = RateTable::findOrFail($id);
        $table->delete();
        return response()->json(['message' => 'Rate table deleted']);
    }

    public function toggleStatus(int $id): JsonResponse
    {
        $table = RateTable::findOrFail($id);
        $table->update(['is_active' => !$table->is_active]);

        return response()->json([
            'message' => $table->is_active ? 'Rate table activated' : 'Rate table deactivated',
            'is_active' => $table->is_active,
            'rate_table' => $table,
        ]);
    }

    public function cloneTable(int $id): JsonResponse
    {
        $original = RateTable::with(['entries', 'factors', 'riders', 'fees', 'modalFactors'])
            ->findOrFail($id);

        $newVersion = $original->version . '-copy';
        $counter = 1;
        while (RateTable::where('product_type', $original->product_type)->where('version', $newVersion)->exists()) {
            $newVersion = $original->version . '-copy-' . $counter++;
        }

        $clone = $original->replicate();
        $clone->version = $newVersion;
        $clone->name = $original->name . ' (Copy)';
        $clone->is_active = false;
        $clone->save();

        foreach ($original->entries as $entry) {
            $clone->entries()->create($entry->only(['rate_key', 'rate_value', 'dimensions']));
        }
        foreach ($original->factors as $factor) {
            $clone->factors()->create($factor->only(['factor_code', 'factor_label', 'option_value', 'apply_mode', 'factor_value', 'sort_order']));
        }
        foreach ($original->riders as $rider) {
            $clone->riders()->create($rider->only(['rider_code', 'rider_label', 'apply_mode', 'rider_value', 'rate_key_pattern', 'is_default', 'sort_order']));
        }
        foreach ($original->fees as $fee) {
            $clone->fees()->create($fee->only(['fee_code', 'fee_label', 'fee_type', 'apply_mode', 'fee_value', 'sort_order']));
        }
        foreach ($original->modalFactors as $mf) {
            $clone->modalFactors()->create($mf->only(['mode', 'factor', 'flat_fee']));
        }

        return response()->json([
            'message' => 'Rate table cloned',
            'rate_table' => $clone->load('carrier:id,name,slug')->loadCount('entries'),
        ], 201);
    }

    // ── Sub-resource CRUD: Entries ────────────────────

    public function storeEntry(Request $request, int $tableId): JsonResponse
    {
        RateTable::findOrFail($tableId);
        $data = $request->validate([
            'rate_key' => 'required|string|max:255',
            'rate_value' => 'required|numeric',
            'dimensions' => 'nullable|array',
        ]);
        $entry = RateTableEntry::create(array_merge($data, ['rate_table_id' => $tableId]));
        return response()->json(['message' => 'Entry created', 'entry' => $entry], 201);
    }

    public function updateEntry(Request $request, int $tableId, int $entryId): JsonResponse
    {
        $entry = RateTableEntry::where('rate_table_id', $tableId)->findOrFail($entryId);
        $data = $request->validate([
            'rate_key' => 'sometimes|string|max:255',
            'rate_value' => 'sometimes|numeric',
            'dimensions' => 'sometimes|nullable|array',
        ]);
        $entry->update($data);
        return response()->json(['message' => 'Entry updated', 'entry' => $entry]);
    }

    public function destroyEntry(int $tableId, int $entryId): JsonResponse
    {
        $entry = RateTableEntry::where('rate_table_id', $tableId)->findOrFail($entryId);
        $entry->delete();
        return response()->json(['message' => 'Entry deleted']);
    }

    // ── Sub-resource CRUD: Factors ───────────────────

    public function storeFactor(Request $request, int $tableId): JsonResponse
    {
        RateTable::findOrFail($tableId);
        $data = $request->validate([
            'factor_code' => 'required|string|max:60',
            'factor_label' => 'required|string|max:255',
            'option_value' => 'required|string|max:120',
            'apply_mode' => 'required|string|in:multiply,add,subtract',
            'factor_value' => 'required|numeric',
            'sort_order' => 'integer',
        ]);
        $factor = RateFactor::create(array_merge($data, ['rate_table_id' => $tableId]));
        return response()->json(['message' => 'Factor created', 'factor' => $factor], 201);
    }

    public function updateFactor(Request $request, int $tableId, int $factorId): JsonResponse
    {
        $factor = RateFactor::where('rate_table_id', $tableId)->findOrFail($factorId);
        $data = $request->validate([
            'factor_code' => 'sometimes|string|max:60',
            'factor_label' => 'sometimes|string|max:255',
            'option_value' => 'sometimes|string|max:120',
            'apply_mode' => 'sometimes|string|in:multiply,add,subtract',
            'factor_value' => 'sometimes|numeric',
            'sort_order' => 'sometimes|integer',
        ]);
        $factor->update($data);
        return response()->json(['message' => 'Factor updated', 'factor' => $factor]);
    }

    public function destroyFactor(int $tableId, int $factorId): JsonResponse
    {
        $factor = RateFactor::where('rate_table_id', $tableId)->findOrFail($factorId);
        $factor->delete();
        return response()->json(['message' => 'Factor deleted']);
    }

    // ── Sub-resource CRUD: Riders ────────────────────

    public function storeRider(Request $request, int $tableId): JsonResponse
    {
        RateTable::findOrFail($tableId);
        $data = $request->validate([
            'rider_code' => 'required|string|max:60',
            'rider_label' => 'required|string|max:255',
            'apply_mode' => 'required|string|in:add,multiply',
            'rider_value' => 'required|numeric',
            'is_default' => 'boolean',
            'sort_order' => 'integer',
        ]);
        $rider = RateRider::create(array_merge($data, ['rate_table_id' => $tableId]));
        return response()->json(['message' => 'Rider created', 'rider' => $rider], 201);
    }

    public function updateRider(Request $request, int $tableId, int $riderId): JsonResponse
    {
        $rider = RateRider::where('rate_table_id', $tableId)->findOrFail($riderId);
        $data = $request->validate([
            'rider_code' => 'sometimes|string|max:60',
            'rider_label' => 'sometimes|string|max:255',
            'apply_mode' => 'sometimes|string|in:add,multiply',
            'rider_value' => 'sometimes|numeric',
            'is_default' => 'sometimes|boolean',
            'sort_order' => 'sometimes|integer',
        ]);
        $rider->update($data);
        return response()->json(['message' => 'Rider updated', 'rider' => $rider]);
    }

    public function destroyRider(int $tableId, int $riderId): JsonResponse
    {
        $rider = RateRider::where('rate_table_id', $tableId)->findOrFail($riderId);
        $rider->delete();
        return response()->json(['message' => 'Rider deleted']);
    }

    // ── Sub-resource CRUD: Fees ──────────────────────

    public function storeFee(Request $request, int $tableId): JsonResponse
    {
        RateTable::findOrFail($tableId);
        $data = $request->validate([
            'fee_code' => 'required|string|max:60',
            'fee_label' => 'required|string|max:255',
            'fee_type' => 'required|string|in:fee,credit',
            'apply_mode' => 'required|string|in:add,percent',
            'fee_value' => 'required|numeric',
            'sort_order' => 'integer',
        ]);
        $fee = RateFee::create(array_merge($data, ['rate_table_id' => $tableId]));
        return response()->json(['message' => 'Fee created', 'fee' => $fee], 201);
    }

    public function updateFee(Request $request, int $tableId, int $feeId): JsonResponse
    {
        $fee = RateFee::where('rate_table_id', $tableId)->findOrFail($feeId);
        $data = $request->validate([
            'fee_code' => 'sometimes|string|max:60',
            'fee_label' => 'sometimes|string|max:255',
            'fee_type' => 'sometimes|string|in:fee,credit',
            'apply_mode' => 'sometimes|string|in:add,percent',
            'fee_value' => 'sometimes|numeric',
            'sort_order' => 'sometimes|integer',
        ]);
        $fee->update($data);
        return response()->json(['message' => 'Fee updated', 'fee' => $fee]);
    }

    public function destroyFee(int $tableId, int $feeId): JsonResponse
    {
        $fee = RateFee::where('rate_table_id', $tableId)->findOrFail($feeId);
        $fee->delete();
        return response()->json(['message' => 'Fee deleted']);
    }

    // ── Carriers list (for dropdowns) ────────────────

    public function carriers(): JsonResponse
    {
        $carriers = Carrier::select('id', 'name', 'slug')
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return response()->json(['carriers' => $carriers]);
    }

    // ── CSV Import ───────────────────────────────────

    public function importCsv(Request $request, int $tableId): JsonResponse
    {
        $table = RateTable::findOrFail($tableId);

        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:5120',
            'type' => 'required|in:entries,factors,riders,fees,modal_factors',
        ]);

        $file = $request->file('file');
        $type = $request->type;
        $rows = array_map('str_getcsv', file($file->getPathname()));
        $headers = array_shift($rows);
        $headers = array_map('trim', $headers);

        $imported = 0;

        if ($type === 'entries') {
            foreach ($rows as $row) {
                $data = array_combine($headers, $row);
                if (!isset($data['rate_key'], $data['rate_value'])) continue;
                RateTableEntry::updateOrCreate(
                    ['rate_table_id' => $table->id, 'rate_key' => trim($data['rate_key'])],
                    ['rate_value' => (float) $data['rate_value'], 'dimensions' => isset($data['dimensions']) ? json_decode($data['dimensions'], true) : null]
                );
                $imported++;
            }
        } elseif ($type === 'factors') {
            foreach ($rows as $row) {
                $data = array_combine($headers, $row);
                if (!isset($data['factor_code'], $data['option_value'], $data['factor_value'])) continue;
                RateFactor::updateOrCreate(
                    ['rate_table_id' => $table->id, 'factor_code' => trim($data['factor_code']), 'option_value' => trim($data['option_value'])],
                    [
                        'factor_label' => trim($data['factor_label'] ?? $data['factor_code']),
                        'apply_mode' => trim($data['apply_mode'] ?? 'multiply'),
                        'factor_value' => (float) $data['factor_value'],
                        'sort_order' => (int) ($data['sort_order'] ?? 0),
                    ]
                );
                $imported++;
            }
        } elseif ($type === 'riders') {
            foreach ($rows as $row) {
                $data = array_combine($headers, $row);
                if (!isset($data['rider_code'], $data['rider_value'])) continue;
                RateRider::updateOrCreate(
                    ['rate_table_id' => $table->id, 'rider_code' => trim($data['rider_code'])],
                    [
                        'rider_label' => trim($data['rider_label'] ?? $data['rider_code']),
                        'apply_mode' => trim($data['apply_mode'] ?? 'add'),
                        'rider_value' => (float) $data['rider_value'],
                        'is_default' => filter_var($data['is_default'] ?? false, FILTER_VALIDATE_BOOLEAN),
                        'sort_order' => (int) ($data['sort_order'] ?? 0),
                    ]
                );
                $imported++;
            }
        } elseif ($type === 'fees') {
            foreach ($rows as $row) {
                $data = array_combine($headers, $row);
                if (!isset($data['fee_code'], $data['fee_value'])) continue;
                RateFee::updateOrCreate(
                    ['rate_table_id' => $table->id, 'fee_code' => trim($data['fee_code'])],
                    [
                        'fee_label' => trim($data['fee_label'] ?? $data['fee_code']),
                        'fee_type' => trim($data['fee_type'] ?? 'fee'),
                        'apply_mode' => trim($data['apply_mode'] ?? 'add'),
                        'fee_value' => (float) $data['fee_value'],
                        'sort_order' => (int) ($data['sort_order'] ?? 0),
                    ]
                );
                $imported++;
            }
        } elseif ($type === 'modal_factors') {
            foreach ($rows as $row) {
                $data = array_combine($headers, $row);
                if (!isset($data['mode'], $data['factor'])) continue;
                RateModalFactor::updateOrCreate(
                    ['rate_table_id' => $table->id, 'mode' => trim($data['mode'])],
                    [
                        'factor' => (float) $data['factor'],
                        'flat_fee' => (float) ($data['flat_fee'] ?? 0),
                    ]
                );
                $imported++;
            }
        }

        return response()->json([
            'message' => "Imported {$imported} {$type}",
            'imported' => $imported,
        ]);
    }

    // ── Import Preview (dry-run) ────────────────────

    public function importPreview(Request $request, int $tableId): JsonResponse
    {
        RateTable::findOrFail($tableId);

        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:5120',
            'type' => 'required|in:entries,factors,riders,fees,modal_factors',
        ]);

        $file = $request->file('file');
        $type = $request->type;
        $rows = array_map('str_getcsv', file($file->getPathname()));
        $headers = array_shift($rows);
        $headers = array_map('trim', $headers);

        $validRows = 0;
        $invalidRows = 0;
        $sampleData = [];

        $requiredFields = match ($type) {
            'entries' => ['rate_key', 'rate_value'],
            'factors' => ['factor_code', 'option_value', 'factor_value'],
            'riders' => ['rider_code', 'rider_value'],
            'fees' => ['fee_code', 'fee_value'],
            'modal_factors' => ['mode', 'factor'],
        };

        // Check headers
        $missingHeaders = array_diff($requiredFields, $headers);
        if (!empty($missingHeaders)) {
            return response()->json([
                'valid' => false,
                'error' => 'Missing required columns: ' . implode(', ', $missingHeaders),
                'headers_found' => $headers,
                'headers_required' => $requiredFields,
            ], 422);
        }

        foreach ($rows as $row) {
            if (count($row) !== count($headers)) {
                $invalidRows++;
                continue;
            }
            $data = array_combine($headers, $row);
            $hasRequired = true;
            foreach ($requiredFields as $field) {
                if (!isset($data[$field]) || trim($data[$field]) === '') {
                    $hasRequired = false;
                    break;
                }
            }
            if ($hasRequired) {
                $validRows++;
                if (count($sampleData) < 5) {
                    $sampleData[] = $data;
                }
            } else {
                $invalidRows++;
            }
        }

        return response()->json([
            'valid' => true,
            'type' => $type,
            'total_rows' => count($rows),
            'valid_rows' => $validRows,
            'invalid_rows' => $invalidRows,
            'headers' => $headers,
            'sample_data' => $sampleData,
        ]);
    }

    // ── Bulk Carrier Import ─────────────────────────

    public function carrierImport(Request $request): JsonResponse
    {
        $request->validate([
            'carrier_id' => 'required|integer|exists:carriers,id',
            'product_type' => 'required|string|max:60',
            'version' => 'required|string|max:20',
            'name' => 'required|string|max:255',
            'effective_date' => 'nullable|date',
            'entries_file' => 'required|file|mimes:csv,txt|max:5120',
            'factors_file' => 'nullable|file|mimes:csv,txt|max:5120',
            'riders_file' => 'nullable|file|mimes:csv,txt|max:5120',
            'fees_file' => 'nullable|file|mimes:csv,txt|max:5120',
            'modal_factors_file' => 'nullable|file|mimes:csv,txt|max:5120',
        ]);

        $table = RateTable::create([
            'product_type' => $request->product_type,
            'version' => $request->version,
            'name' => $request->name,
            'carrier_id' => $request->carrier_id,
            'effective_date' => $request->effective_date ?? now(),
            'is_active' => true,
        ]);

        $results = [];

        // Import entries (required)
        $results['entries'] = $this->importFileToTable($table, $request->file('entries_file'), 'entries');

        // Import optional sub-resources
        foreach (['factors', 'riders', 'fees', 'modal_factors'] as $type) {
            $fileKey = $type . '_file';
            if ($request->hasFile($fileKey)) {
                $results[$type] = $this->importFileToTable($table, $request->file($fileKey), $type);
            }
        }

        return response()->json([
            'message' => 'Carrier rate table created with imported data',
            'rate_table' => $table->load('carrier:id,name,slug')->loadCount('entries'),
            'import_results' => $results,
        ], 201);
    }

    private function importFileToTable(RateTable $table, $file, string $type): array
    {
        $rows = array_map('str_getcsv', file($file->getPathname()));
        $headers = array_map('trim', array_shift($rows));
        $imported = 0;

        foreach ($rows as $row) {
            if (count($row) !== count($headers)) continue;
            $data = array_combine($headers, $row);

            switch ($type) {
                case 'entries':
                    if (!isset($data['rate_key'], $data['rate_value'])) continue 2;
                    RateTableEntry::create([
                        'rate_table_id' => $table->id,
                        'rate_key' => trim($data['rate_key']),
                        'rate_value' => (float) $data['rate_value'],
                        'dimensions' => isset($data['dimensions']) ? json_decode($data['dimensions'], true) : null,
                    ]);
                    break;
                case 'factors':
                    if (!isset($data['factor_code'], $data['option_value'], $data['factor_value'])) continue 2;
                    RateFactor::create([
                        'rate_table_id' => $table->id,
                        'factor_code' => trim($data['factor_code']),
                        'factor_label' => trim($data['factor_label'] ?? $data['factor_code']),
                        'option_value' => trim($data['option_value']),
                        'apply_mode' => trim($data['apply_mode'] ?? 'multiply'),
                        'factor_value' => (float) $data['factor_value'],
                        'sort_order' => (int) ($data['sort_order'] ?? 0),
                    ]);
                    break;
                case 'riders':
                    if (!isset($data['rider_code'], $data['rider_value'])) continue 2;
                    RateRider::create([
                        'rate_table_id' => $table->id,
                        'rider_code' => trim($data['rider_code']),
                        'rider_label' => trim($data['rider_label'] ?? $data['rider_code']),
                        'apply_mode' => trim($data['apply_mode'] ?? 'add'),
                        'rider_value' => (float) $data['rider_value'],
                        'is_default' => filter_var($data['is_default'] ?? false, FILTER_VALIDATE_BOOLEAN),
                        'sort_order' => (int) ($data['sort_order'] ?? 0),
                    ]);
                    break;
                case 'fees':
                    if (!isset($data['fee_code'], $data['fee_value'])) continue 2;
                    RateFee::create([
                        'rate_table_id' => $table->id,
                        'fee_code' => trim($data['fee_code']),
                        'fee_label' => trim($data['fee_label'] ?? $data['fee_code']),
                        'fee_type' => trim($data['fee_type'] ?? 'fee'),
                        'apply_mode' => trim($data['apply_mode'] ?? 'add'),
                        'fee_value' => (float) $data['fee_value'],
                        'sort_order' => (int) ($data['sort_order'] ?? 0),
                    ]);
                    break;
                case 'modal_factors':
                    if (!isset($data['mode'], $data['factor'])) continue 2;
                    RateModalFactor::create([
                        'rate_table_id' => $table->id,
                        'mode' => trim($data['mode']),
                        'factor' => (float) $data['factor'],
                        'flat_fee' => (float) ($data['flat_fee'] ?? 0),
                    ]);
                    break;
            }
            $imported++;
        }

        return ['type' => $type, 'imported' => $imported];
    }
}
