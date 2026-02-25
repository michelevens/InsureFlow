<?php

namespace App\Http\Controllers;

use App\Models\ZipCode;
use Illuminate\Http\Request;

class ZipCodeController extends Controller
{
    /**
     * Lookup a specific ZIP code — returns city, state, county.
     */
    public function lookup(string $zip)
    {
        $results = ZipCode::where('zip', $zip)->get(['zip', 'city', 'state', 'county', 'latitude', 'longitude', 'timezone']);

        if ($results->isEmpty()) {
            return response()->json(['message' => 'ZIP code not found'], 404);
        }

        // A ZIP can map to multiple cities; return all matches
        return response()->json($results);
    }

    /**
     * Autocomplete search — takes partial ZIP or city name, returns up to 10 matches.
     */
    public function search(Request $request)
    {
        $q = trim($request->query('q', ''));

        if (strlen($q) < 2) {
            return response()->json([]);
        }

        // If the query looks like a ZIP (all digits), search by ZIP prefix
        if (preg_match('/^\d+$/', $q)) {
            $results = ZipCode::where('zip', 'like', "{$q}%")
                ->select('zip', 'city', 'state', 'county')
                ->orderBy('zip')
                ->limit(10)
                ->get();
        } else {
            // Search by city name (case-insensitive)
            $results = ZipCode::where('city', 'ilike', "%{$q}%")
                ->select('zip', 'city', 'state', 'county')
                ->orderByRaw("CASE WHEN LOWER(city) = LOWER(?) THEN 0 WHEN LOWER(city) LIKE LOWER(?) THEN 1 ELSE 2 END", [$q, "{$q}%"])
                ->orderBy('state')
                ->orderBy('city')
                ->limit(10)
                ->get();
        }

        return response()->json($results);
    }
}
