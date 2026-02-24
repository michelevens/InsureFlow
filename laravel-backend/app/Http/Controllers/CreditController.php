<?php

namespace App\Http\Controllers;

use App\Models\LeadCredit;
use Illuminate\Http\Request;

class CreditController extends Controller
{
    /**
     * Get credit balance for the current user/agency.
     */
    public function balance(Request $request)
    {
        $user = $request->user();
        $agencyId = $request->attributes->get('agency_id');

        $credit = LeadCredit::firstOrCreate(
            ['user_id' => $user->id, 'agency_id' => $agencyId],
            ['credits_balance' => 0, 'credits_used' => 0]
        );

        return response()->json([
            'credits_balance' => $credit->credits_balance,
            'credits_used' => $credit->credits_used,
            'last_replenished_at' => $credit->last_replenished_at,
        ]);
    }

    /**
     * Get credit transaction history.
     */
    public function history(Request $request)
    {
        $user = $request->user();
        $agencyId = $request->attributes->get('agency_id');

        $credit = LeadCredit::where('user_id', $user->id)
            ->where('agency_id', $agencyId)
            ->first();

        if (!$credit) {
            return response()->json(['transactions' => [], 'balance' => 0]);
        }

        $transactions = $credit->transactions()
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json([
            'transactions' => $transactions,
            'balance' => $credit->credits_balance,
        ]);
    }
}
