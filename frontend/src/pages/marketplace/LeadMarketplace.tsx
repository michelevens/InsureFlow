import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, Badge, Button, Input, useConfirm } from '@/components/ui';
import { Search, ShoppingCart, Tag, MapPin, Clock, Star, TrendingUp, Phone, Mail, RefreshCw, ArrowUpDown, Gavel, Package, CreditCard, Loader2, ShieldAlert, ArrowRight, Wallet, DollarSign, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { marketplaceService, type LeadMarketplaceListing, type LeadMarketplaceStats, type LeadMarketplaceTransaction, type SellerBalanceResponse, type SellerPayoutRequest } from '@/services/api/marketplace';
import { toast } from 'sonner';

const GRADE_COLORS: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
  A: 'success', B: 'success', C: 'warning', D: 'danger', F: 'danger',
};

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'score_desc', label: 'Best Score' },
];

type Tab = 'browse' | 'my-listings' | 'transactions' | 'payouts';

export default function LeadMarketplace() {
  const confirm = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>('browse');
  const [listings, setListings] = useState<LeadMarketplaceListing[]>([]);
  const [myListings, setMyListings] = useState<LeadMarketplaceListing[]>([]);
  const [stats, setStats] = useState<LeadMarketplaceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<number | null>(null);
  const [biddingId, setBiddingId] = useState<number | null>(null);
  const [requiresUpgrade, setRequiresUpgrade] = useState(false);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [sort, setSort] = useState('newest');

  // Handle Stripe return params
  useEffect(() => {
    if (searchParams.get('purchased') === 'true') {
      toast.success('Payment successful! Your lead purchase is being processed.');
      setSearchParams({}, { replace: true });
      setTab('transactions');
    } else if (searchParams.get('canceled') === 'true') {
      toast.info('Payment was canceled. No charge was made.');
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const fetchBrowse = useCallback(async () => {
    setLoading(true);
    try {
      const res = await marketplaceService.browseLeads({
        insurance_type: typeFilter || undefined,
        state: stateFilter || undefined,
        sort,
      });
      setListings(res.data);
      setRequiresUpgrade(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('marketplace access') || msg.includes('HTTP 403') || msg.includes('Upgrade to')) {
        setRequiresUpgrade(true);
      } else {
        toast.error('Failed to load marketplace listings');
      }
    } finally {
      setLoading(false);
    }
  }, [typeFilter, stateFilter, sort]);

  const fetchMyListings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await marketplaceService.myListings();
      setMyListings(res.data);
    } catch {
      toast.error('Failed to load your listings');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await marketplaceService.leadMarketplaceStats();
      setStats(res);
    } catch { /* ignore */ }
    try {
      const cb = await marketplaceService.creditBalance();
      setCreditBalance(cb.credits_balance ?? null);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (tab === 'browse') fetchBrowse();
    else if (tab === 'my-listings') fetchMyListings();
    else setLoading(false); // transactions & payouts manage their own loading
  }, [tab, fetchBrowse, fetchMyListings]);

  const handlePurchase = async (listing: LeadMarketplaceListing) => {
    // Check credit balance before purchase
    if (creditBalance !== null && creditBalance <= 0) {
      toast.error('No marketplace credits remaining. Upgrade your plan for more credits.');
      return;
    }

    const ok = await confirm({
      title: 'Purchase Lead',
      message: `Purchase this ${listing.insurance_type.replace(/_/g, ' ')} lead for $${Number(listing.asking_price).toFixed(2)}?${creditBalance !== null ? `\n\nCredits remaining after purchase: ${creditBalance - 1}` : ''}`,
      confirmLabel: 'Buy Now',
      cancelLabel: 'Cancel',
      variant: 'info',
    });
    if (!ok) return;
    setPurchasing(listing.id);
    try {
      // Try Stripe checkout first
      const checkoutRes = await marketplaceService.checkoutLead(listing.id);
      if (checkoutRes.checkout_url) {
        // Redirect to Stripe Checkout
        window.location.href = checkoutRes.checkout_url;
        return;
      }
      // If no checkout_url returned (Stripe not configured), it completed directly
      toast.success('Lead purchased! Check your CRM.');
      if (creditBalance !== null) setCreditBalance(creditBalance - 1);
      fetchBrowse();
      fetchStats();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('credits') || msg.includes('HTTP 402')) {
        toast.error('No marketplace credits remaining. Upgrade your plan for more credits.');
      } else {
        // If checkout returns a direct purchase response (Stripe not configured, fallback)
        const errorData = err && typeof err === 'object' && 'message' in err ? err : null;
        if (errorData && 'lead' in (errorData as Record<string, unknown>)) {
          toast.success('Lead purchased! Check your CRM.');
          if (creditBalance !== null) setCreditBalance(creditBalance - 1);
          fetchBrowse();
          fetchStats();
        } else {
          toast.error('Purchase failed. The listing may no longer be available.');
        }
      }
    } finally {
      setPurchasing(null);
    }
  };

  const handleWithdraw = async (id: number) => {
    try {
      await marketplaceService.withdrawListing(id);
      toast.success('Listing withdrawn');
      fetchMyListings();
      fetchStats();
    } catch {
      toast.error('Failed to withdraw listing');
    }
  };

  const handleBid = async (listing: LeadMarketplaceListing) => {
    const minRequired = Math.max(listing.min_bid ?? 0, (listing.current_bid ?? 0) + 0.50);
    const amount = prompt(`Enter bid amount (minimum $${minRequired.toFixed(2)}):`);
    if (!amount) return;
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed < minRequired) {
      toast.error(`Bid must be at least $${minRequired.toFixed(2)}`);
      return;
    }
    setBiddingId(listing.id);
    try {
      await marketplaceService.placeBid(listing.id, parsed);
      toast.success('Bid placed!');
      fetchBrowse();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to place bid');
    } finally {
      setBiddingId(null);
    }
  };

  const filtered = listings.filter(l => {
    if (!search) return true;
    const q = search.toLowerCase();
    return l.insurance_type.toLowerCase().includes(q)
      || l.state?.toLowerCase().includes(q)
      || l.seller_agency?.name?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Lead Marketplace</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Buy and sell insurance leads across the platform</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => { fetchStats(); if (tab === 'browse') fetchBrowse(); else fetchMyListings(); }}>
          <RefreshCw className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>

      {/* Upgrade Gate */}
      {requiresUpgrade && (
        <Card className="p-12 text-center border-2 border-dashed border-shield-300 dark:border-shield-700">
          <ShieldAlert className="w-16 h-16 text-shield-400 dark:text-shield-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Marketplace Access Required</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
            Your current plan doesn't include lead marketplace access. Upgrade to Agent Pro or higher to browse and purchase leads.
          </p>
          <Link to="/pricing">
            <Button variant="shield" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Upgrade Your Plan
            </Button>
          </Link>
        </Card>
      )}

      {/* Stats Cards */}
      {!requiresUpgrade && stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-shield-600 dark:text-shield-400">{stats.marketplace.total_active_listings}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Active Listings</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-savings-600 dark:text-savings-400">{stats.buyer.total_purchased}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Leads Purchased</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.seller.total_sold}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Leads Sold</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-700 dark:text-slate-200">${stats.seller.total_revenue.toFixed(2)}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Seller Revenue</p>
          </Card>
          {creditBalance !== null && (
            <Card className={`p-4 text-center ${creditBalance <= 0 ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10' : ''}`}>
              <p className={`text-2xl font-bold ${creditBalance > 5 ? 'text-savings-600 dark:text-savings-400' : creditBalance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                {creditBalance === -1 ? '∞' : creditBalance}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Credits Left</p>
            </Card>
          )}
        </div>
      )}

      {/* Tabs — hidden when upgrade required */}
      {!requiresUpgrade && (
        <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700/50">
          {([['browse', 'Browse Leads'], ['my-listings', 'My Listings'], ['transactions', 'Transactions'], ['payouts', 'Payouts']] as [Tab, string][]).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === key ? 'border-shield-500 text-shield-600 dark:text-shield-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200'}`}>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Browse Tab */}
      {!requiresUpgrade && tab === 'browse' && (
        <>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <Input className="pl-9" placeholder="Search by type, state, or agency..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
              <option value="">All Types</option>
              {['Auto', 'Home', 'Life - Term', 'Life - Whole', 'Health', 'Commercial GL', 'Workers Comp', 'Medicare', 'LTC'].map(t =>
                <option key={t} value={t}>{t}</option>
              )}
            </select>
            <select value={stateFilter} onChange={e => setStateFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
              <option value="">All States</option>
              {['FL', 'TX', 'CA', 'NY', 'GA', 'IL', 'VA', 'AZ', 'OH', 'PA', 'NC', 'MI'].map(s =>
                <option key={s} value={s}>{s}</option>
              )}
            </select>
            <div className="flex items-center gap-1">
              <ArrowUpDown className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              <select value={sort} onChange={e => setSort(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500">Loading marketplace...</div>
          ) : filtered.length === 0 ? (
            <Card className="p-12 text-center">
              <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">No leads available</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Check back later or adjust your filters</p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filtered.map(listing => (
                <ListingCard key={listing.id} listing={listing}
                  onPurchase={() => handlePurchase(listing)}
                  onBid={() => handleBid(listing)}
                  purchasing={purchasing === listing.id}
                  bidding={biddingId === listing.id} />
              ))}
            </div>
          )}
        </>
      )}

      {/* My Listings Tab */}
      {!requiresUpgrade && tab === 'my-listings' && (
        loading ? (
          <div className="text-center py-12 text-slate-400 dark:text-slate-500">Loading...</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">{myListings.length} listing{myListings.length !== 1 ? 's' : ''}</p>
              <Button variant="primary" size="sm" onClick={() => toast.info('Select leads from your CRM to bulk-list them here.')}>
                <Package className="w-4 h-4 mr-1" /> Bulk List
              </Button>
            </div>
            {myListings.length === 0 ? (
              <Card className="p-12 text-center">
                <Tag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">No listings yet</p>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">List leads from your CRM to sell them on the marketplace</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {myListings.map(listing => (
                  <Card key={listing.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant={listing.status === 'active' ? 'success' : listing.status === 'sold' ? 'default' : 'warning'}>
                          {listing.status}
                        </Badge>
                        {listing.listing_type === 'auction' && (
                          <Badge variant="warning">
                            <Gavel className="w-3 h-3 mr-1" /> Auction
                          </Badge>
                        )}
                        <span className="font-medium text-slate-900 dark:text-white">{listing.insurance_type}</span>
                        {listing.state && <span className="text-slate-500 dark:text-slate-400 text-sm">{listing.state}</span>}
                        <span className="text-shield-600 dark:text-shield-400 font-bold">${listing.asking_price}</span>
                        {listing.listing_type === 'auction' && listing.bid_count > 0 && (
                          <span className="text-xs text-amber-600 dark:text-amber-400">
                            {listing.bid_count} bid{listing.bid_count !== 1 ? 's' : ''} — current: ${listing.current_bid}
                          </span>
                        )}
                        {listing.suggested_price != null && (
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            Suggested: ${listing.suggested_price}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {listing.status === 'sold' && listing.transaction && (
                          <span className="text-sm text-savings-600 dark:text-savings-400 font-medium">
                            Sold — payout ${listing.transaction.seller_payout}
                          </span>
                        )}
                        {listing.status === 'active' && (
                          <Button variant="ghost" size="sm" onClick={() => handleWithdraw(listing.id)}>
                            Withdraw
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )
      )}

      {/* Transactions Tab */}
      {!requiresUpgrade && tab === 'transactions' && <TransactionsTab />}

      {/* Payouts Tab */}
      {!requiresUpgrade && tab === 'payouts' && <PayoutsTab />}
    </div>
  );
}

function ListingCard({ listing, onPurchase, onBid, purchasing, bidding }: {
  listing: LeadMarketplaceListing;
  onPurchase: () => void;
  onBid: () => void;
  purchasing: boolean;
  bidding: boolean;
}) {
  const isAuction = listing.listing_type === 'auction';

  return (
    <Card className="p-5 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge>{listing.insurance_type}</Badge>
          {listing.lead_grade && (
            <Badge variant={GRADE_COLORS[listing.lead_grade] || 'default'}>
              Grade {listing.lead_grade}
            </Badge>
          )}
          {isAuction && (
            <Badge variant="warning">
              <Gavel className="w-3 h-3 mr-1" /> Auction
            </Badge>
          )}
        </div>
        {isAuction ? (
          <div className="text-right">
            <span className="text-xl font-bold text-amber-600 dark:text-amber-400">
              ${listing.current_bid || listing.min_bid || listing.asking_price}
            </span>
            {listing.bid_count > 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400">{listing.bid_count} bid{listing.bid_count !== 1 ? 's' : ''}</p>
            )}
          </div>
        ) : (
          <span className="text-xl font-bold text-shield-600 dark:text-shield-400">${listing.asking_price}</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm mb-4">
        {listing.state && (
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <MapPin className="w-3.5 h-3.5" /> {listing.state} {listing.zip_prefix && `(${listing.zip_prefix}xx)`}
          </div>
        )}
        {listing.lead_score !== null && (
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <Star className="w-3.5 h-3.5" /> Score: {listing.lead_score}/100
          </div>
        )}
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
          <Clock className="w-3.5 h-3.5" /> {listing.days_old}d old
        </div>
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
          <TrendingUp className="w-3.5 h-3.5" /> {listing.coverage_level || 'Standard'}
        </div>
        {listing.has_phone && (
          <div className="flex items-center gap-1.5 text-savings-600 dark:text-savings-400">
            <Phone className="w-3.5 h-3.5" /> Has phone
          </div>
        )}
        {listing.has_email && (
          <div className="flex items-center gap-1.5 text-savings-600 dark:text-savings-400">
            <Mail className="w-3.5 h-3.5" /> Has email
          </div>
        )}
      </div>

      {isAuction && listing.auction_ends_at && (
        <p className="text-xs text-amber-600 dark:text-amber-400 mb-3">
          <Clock className="w-3 h-3 inline mr-1" />
          Auction ends {new Date(listing.auction_ends_at).toLocaleDateString()}
        </p>
      )}

      {listing.seller_notes && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 italic">{listing.seller_notes}</p>
      )}

      {listing.seller_agency && (
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">From: {listing.seller_agency.name}</p>
      )}

      {isAuction ? (
        <Button className="w-full" variant="shield" onClick={onBid} disabled={bidding}>
          <Gavel className="w-4 h-4 mr-1" />
          {bidding ? 'Placing bid...' : 'Place Bid'}
        </Button>
      ) : (
        <Button className="w-full" onClick={onPurchase} disabled={purchasing}>
          {purchasing ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <CreditCard className="w-4 h-4 mr-1" />
          )}
          {purchasing ? 'Processing...' : `Buy Now — $${listing.asking_price}`}
        </Button>
      )}
    </Card>
  );
}

function PayoutsTab() {
  const confirm = useConfirm();
  const [balance, setBalance] = useState<SellerBalanceResponse | null>(null);
  const [history, setHistory] = useState<SellerPayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    Promise.all([
      marketplaceService.sellerBalance(),
      marketplaceService.payoutHistory(),
    ]).then(([bal, hist]) => {
      setBalance(bal);
      setHistory(hist.data);
    }).catch(() => toast.error('Failed to load payout data'))
      .finally(() => setLoading(false));
  }, []);

  const handleRequest = async () => {
    const val = parseFloat(amount);
    if (!val || val < 5) { toast.error('Minimum payout is $5.00'); return; }
    if (balance && val > balance.available) { toast.error('Amount exceeds available balance'); return; }

    const ok = await confirm({
      title: 'Request Payout',
      message: `Request a payout of $${val.toFixed(2)}? This will be reviewed by an admin before processing.`,
      variant: 'info',
    });
    if (!ok) return;

    setRequesting(true);
    try {
      const res = await marketplaceService.requestPayout(val);
      toast.success(res.message);
      setBalance(prev => prev ? { ...prev, available: res.new_available_balance } : prev);
      setHistory(prev => [res.request, ...prev]);
      setAmount('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to request payout';
      toast.error(msg);
    } finally {
      setRequesting(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-slate-400 dark:text-slate-500">Loading payout data...</div>;

  const STATUS_CONFIG: Record<string, { icon: React.ReactNode; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' }> = {
    pending: { icon: <Clock className="w-3 h-3" />, variant: 'warning' },
    approved: { icon: <CheckCircle className="w-3 h-3" />, variant: 'info' },
    processing: { icon: <Loader2 className="w-3 h-3 animate-spin" />, variant: 'info' },
    completed: { icon: <CheckCircle className="w-3 h-3" />, variant: 'success' },
    rejected: { icon: <XCircle className="w-3 h-3" />, variant: 'danger' },
    failed: { icon: <AlertCircle className="w-3 h-3" />, variant: 'danger' },
  };

  return (
    <div className="space-y-6">
      {/* Balance Cards */}
      {balance && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center border-2 border-savings-200 dark:border-savings-800 bg-savings-50 dark:bg-savings-900/10">
            <Wallet className="w-5 h-5 text-savings-600 dark:text-savings-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-savings-600 dark:text-savings-400">${balance.available.toFixed(2)}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Available to Withdraw</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">${balance.pending.toFixed(2)}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Pending</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-shield-600 dark:text-shield-400">${balance.lifetime_earned.toFixed(2)}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Lifetime Earned</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-600 dark:text-slate-300">${balance.lifetime_paid.toFixed(2)}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Total Paid Out</p>
          </Card>
        </div>
      )}

      {/* Request Payout */}
      {balance && balance.available >= 5 && (
        <Card className="p-5">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4" /> Request Payout
          </h3>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-sm text-slate-500 dark:text-slate-400 mb-1 block">Amount ($5.00 min)</label>
              <Input type="number" min="5" max={balance.available} step="0.01"
                placeholder={`Up to $${balance.available.toFixed(2)}`}
                value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
            <Button variant="shield" onClick={handleRequest} disabled={requesting || !amount}>
              {requesting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Wallet className="w-4 h-4 mr-1" />}
              {requesting ? 'Submitting...' : 'Request Payout'}
            </Button>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Payouts are reviewed by admin before processing via Stripe Connect.</p>
        </Card>
      )}

      {/* Payout History */}
      <div>
        <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Payout History</h3>
        {history.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-slate-500 dark:text-slate-400">No payout requests yet. Sell leads to earn marketplace revenue.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {history.map(req => {
              const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
              return (
                <Card key={req.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant={cfg.variant}>
                        <span className="flex items-center gap-1">{cfg.icon} {req.status}</span>
                      </Badge>
                      <span className="font-bold text-lg">${parseFloat(req.amount).toFixed(2)}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {new Date(req.created_at).toLocaleDateString()}
                      </p>
                      {req.paid_at && (
                        <p className="text-xs text-savings-600 dark:text-savings-400">Paid {new Date(req.paid_at).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                  {req.admin_notes && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 italic">Admin: {req.admin_notes}</p>
                  )}
                  {req.failure_reason && (
                    <p className="text-sm text-red-500 mt-2">Error: {req.failure_reason}</p>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function TransactionsTab() {
  const [txType, setTxType] = useState<'all' | 'bought' | 'sold'>('all');
  const [transactions, setTransactions] = useState<LeadMarketplaceTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    marketplaceService.leadMarketplaceTransactions(txType === 'all' ? undefined : txType)
      .then(res => setTransactions(res.data))
      .catch(() => toast.error('Failed to load transactions'))
      .finally(() => setLoading(false));
  }, [txType]);

  if (loading) return <div className="text-center py-12 text-slate-400 dark:text-slate-500">Loading transactions...</div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['all', 'bought', 'sold'] as const).map(t => (
          <button key={t} onClick={() => setTxType(t)}
            className={`px-3 py-1.5 text-sm rounded-lg ${txType === t ? 'bg-shield-100 dark:bg-shield-900/30 text-shield-700 dark:text-shield-300 font-medium' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800'}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {transactions.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-slate-500 dark:text-slate-400">No transactions yet</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {transactions.map(tx => (
            <Card key={tx.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant={tx.direction === 'bought' ? 'default' : 'success'}>
                    {tx.direction === 'bought' ? 'Purchased' : 'Sold'}
                  </Badge>
                  {tx.payment_status && (
                    <Badge variant={tx.payment_status === 'completed' ? 'success' : tx.payment_status === 'pending' ? 'warning' : 'danger'}>
                      {tx.payment_status}
                    </Badge>
                  )}
                  <span className="font-medium">{tx.listing?.insurance_type || 'Lead'}</span>
                  {tx.listing?.state && <span className="text-slate-500 dark:text-slate-400 text-sm">{tx.listing.state}</span>}
                </div>
                <div className="text-right">
                  <p className={`font-bold ${tx.direction === 'bought' ? 'text-red-600 dark:text-red-400' : 'text-savings-600 dark:text-savings-400'}`}>
                    {tx.direction === 'bought' ? `-$${tx.purchase_price}` : `+$${tx.seller_payout}`}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {tx.paid_at
                      ? `Paid ${new Date(tx.paid_at).toLocaleDateString()}`
                      : new Date(tx.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
