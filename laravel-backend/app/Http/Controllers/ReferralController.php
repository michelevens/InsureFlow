<?php
namespace App\Http\Controllers;

use App\Models\Referral;
use App\Models\ReferralCode;
use App\Models\ReferralCredit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReferralController extends Controller
{
    private const REFERRER_REWARD = 25.00;
    private const REFERRED_REWARD = 10.00;

    public function dashboard(Request $request): JsonResponse
    {
        $user = $request->user();
        $code = ReferralCode::firstOrCreate(
            ['user_id' => $user->id],
            ['code' => ReferralCode::generateCode($user)]
        );

        $referrals = Referral::where('referrer_id', $user->id)
            ->with('referred:id,name,email,created_at')
            ->orderByDesc('created_at')
            ->get();

        $balance = ReferralCredit::where('user_id', $user->id)->sum('amount');
        $credits = ReferralCredit::where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->limit(20)
            ->get();

        return response()->json([
            'code' => $code->code,
            'referral_url' => rtrim(config('app.frontend_url', env('FRONTEND_URL', 'https://insurons.com')), '/') . '/register?ref=' . $code->code,
            'stats' => [
                'total_referrals' => $referrals->count(),
                'pending' => $referrals->where('status', 'pending')->count(),
                'qualified' => $referrals->where('status', 'qualified')->count(),
                'rewarded' => $referrals->where('status', 'rewarded')->count(),
                'total_earned' => $credits->where('type', 'earned')->sum('amount') + $credits->where('type', 'bonus')->sum('amount'),
            ],
            'balance' => round($balance, 2),
            'referrals' => $referrals->map(fn ($r) => [
                'id' => $r->id,
                'referred_name' => $r->referred->name ?? 'Unknown',
                'status' => $r->status,
                'created_at' => $r->created_at->toISOString(),
                'qualified_at' => $r->qualified_at?->toISOString(),
                'rewarded_at' => $r->rewarded_at?->toISOString(),
            ]),
            'credits' => $credits->map(fn ($c) => [
                'id' => $c->id,
                'amount' => $c->amount,
                'type' => $c->type,
                'description' => $c->description,
                'created_at' => $c->created_at->toISOString(),
            ]),
        ]);
    }

    public function validateCode(Request $request): JsonResponse
    {
        $request->validate(['code' => 'required|string|max:20']);
        $code = ReferralCode::where('code', strtoupper($request->code))->first();

        if (!$code || !$code->isUsable()) {
            return response()->json(['valid' => false, 'message' => 'Invalid or expired referral code.']);
        }

        return response()->json([
            'valid' => true,
            'referrer_name' => $code->user->name ?? 'An Insurons user',
        ]);
    }

    public function applyCode(Request $request): JsonResponse
    {
        $request->validate(['code' => 'required|string|max:20']);
        $user = $request->user();
        $code = ReferralCode::where('code', strtoupper($request->code))->first();

        if (!$code || !$code->isUsable()) {
            return response()->json(['error' => 'Invalid or expired referral code.'], 422);
        }
        if ($code->user_id === $user->id) {
            return response()->json(['error' => 'You cannot use your own referral code.'], 422);
        }
        if (Referral::where('referred_id', $user->id)->exists()) {
            return response()->json(['error' => 'You have already been referred.'], 422);
        }

        return DB::transaction(function () use ($user, $code) {
            $referral = Referral::create([
                'referrer_id' => $code->user_id,
                'referred_id' => $user->id,
                'referral_code_id' => $code->id,
                'status' => 'pending',
            ]);
            $code->increment('uses');

            ReferralCredit::create([
                'user_id' => $user->id,
                'amount' => self::REFERRED_REWARD,
                'type' => 'bonus',
                'description' => 'Welcome bonus for joining via referral',
                'referral_id' => $referral->id,
            ]);

            return response()->json([
                'message' => 'Referral code applied! You received a $' . self::REFERRED_REWARD . ' credit.',
                'credit' => self::REFERRED_REWARD,
            ]);
        });
    }

    public function leaderboard(): JsonResponse
    {
        $top = Referral::select('referrer_id', DB::raw('COUNT(*) as count'))
            ->where('status', 'rewarded')
            ->groupBy('referrer_id')
            ->orderByDesc('count')
            ->limit(10)
            ->with('referrer:id,name')
            ->get()
            ->map(fn ($r) => [
                'name' => $r->referrer->name ?? 'Anonymous',
                'referrals' => $r->count,
            ]);

        return response()->json(['leaderboard' => $top]);
    }

    public static function qualifyReferral(int $userId): void
    {
        $referral = Referral::where('referred_id', $userId)->where('status', 'pending')->first();
        if (!$referral) return;

        DB::transaction(function () use ($referral) {
            $referral->update(['status' => 'rewarded', 'qualified_at' => now(), 'rewarded_at' => now()]);

            ReferralCredit::create([
                'user_id' => $referral->referrer_id,
                'amount' => self::REFERRER_REWARD,
                'type' => 'earned',
                'description' => 'Referral reward — your friend completed their first action',
                'referral_id' => $referral->id,
            ]);
        });
    }
}
