import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, Badge, Button, Input, useConfirm } from '@/components/ui';
import { Search, ShoppingCart, Tag, MapPin, Clock, Star, TrendingUp, Phone, Mail, RefreshCw, ArrowUpDown, Gavel, Package, CreditCard, Loader2 } from 'lucide-react';
import { marketplaceService, type LeadMarketplaceListing, type LeadMarketplaceStats, type LeadMarketplaceTransaction } from '@/services/api/marketplace';
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

type Tab = 'browse' | 'my-listings' | 'transactions';

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
    } catch {
      toast.error('Failed to load marketplace listings');
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
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (tab === 'browse') fetchBrowse();
    else if (tab === 'my-listings') fetchMyListings();
    else setLoading(false);
  }, [tab, fetchBrowse, fetchMyListings]);

  const handlePurchase = async (listing: LeadMarketplaceListing) => {
    const ok = await confirm({
      title: 'Purchase Lead',
      message: `Purchase this ${listing.insurance_type.replace(/_/g, ' ')} lead for $${Number(listing.asking_price).toFixed(2)}?`,
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
      fetchBrowse();
      fetchStats();
    } catch (err) {
      // If checkout returns a direct purchase response (Stripe not configured, fallback)
      const errorData = err && typeof err === 'object' && 'message' in err ? err : null;
      if (errorData && 'lead' in (errorData as Record<string, unknown>)) {
        toast.success('Lead purchased! Check your CRM.');
        fetchBrowse();
        fetchStats();
      } else {
        toast.error('Purchase failed. The listing may no longer be available.');
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
          <h1 className="text-2xl font-bold text-slate-900">Lead Marketplace</h1>
          <p className="text-slate-500 mt-1">Buy and sell insurance leads across the platform</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => { fetchStats(); if (tab === 'browse') fetchBrowse(); else fetchMyListings(); }}>
          <RefreshCw className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-shield-600">{stats.marketplace.total_active_listings}</p>
            <p className="text-xs text-slate-500">Active Listings</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-savings-600">{stats.buyer.total_purchased}</p>
            <p className="text-xs text-slate-500">Leads Purchased</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{stats.seller.total_sold}</p>
            <p className="text-xs text-slate-500">Leads Sold</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-700">${stats.seller.total_revenue.toFixed(2)}</p>
            <p className="text-xs text-slate-500">Seller Revenue</p>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {([['browse', 'Browse Leads'], ['my-listings', 'My Listings'], ['transactions', 'Transactions']] as [Tab, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === key ? 'border-shield-500 text-shield-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Browse Tab */}
      {tab === 'browse' && (
        <>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
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
              <ArrowUpDown className="w-4 h-4 text-slate-400" />
              <select value={sort} onChange={e => setSort(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400">Loading marketplace...</div>
          ) : filtered.length === 0 ? (
            <Card className="p-12 text-center">
              <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No leads available</p>
              <p className="text-slate-400 text-sm mt-1">Check back later or adjust your filters</p>
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
      {tab === 'my-listings' && (
        loading ? (
          <div className="text-center py-12 text-slate-400">Loading...</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{myListings.length} listing{myListings.length !== 1 ? 's' : ''}</p>
              <Button variant="primary" size="sm" onClick={() => toast.info('Select leads from your CRM to bulk-list them here.')}>
                <Package className="w-4 h-4 mr-1" /> Bulk List
              </Button>
            </div>
            {myListings.length === 0 ? (
              <Card className="p-12 text-center">
                <Tag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No listings yet</p>
                <p className="text-slate-400 text-sm mt-1">List leads from your CRM to sell them on the marketplace</p>
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
                        <span className="font-medium text-slate-900">{listing.insurance_type}</span>
                        {listing.state && <span className="text-slate-500 text-sm">{listing.state}</span>}
                        <span className="text-shield-600 font-bold">${listing.asking_price}</span>
                        {listing.listing_type === 'auction' && listing.bid_count > 0 && (
                          <span className="text-xs text-amber-600">
                            {listing.bid_count} bid{listing.bid_count !== 1 ? 's' : ''} — current: ${listing.current_bid}
                          </span>
                        )}
                        {listing.suggested_price != null && (
                          <span className="text-xs text-slate-400">
                            Suggested: ${listing.suggested_price}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {listing.status === 'sold' && listing.transaction && (
                          <span className="text-sm text-savings-600 font-medium">
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
      {tab === 'transactions' && <TransactionsTab />}
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
            <span className="text-xl font-bold text-amber-600">
              ${listing.current_bid || listing.min_bid || listing.asking_price}
            </span>
            {listing.bid_count > 0 && (
              <p className="text-xs text-slate-500">{listing.bid_count} bid{listing.bid_count !== 1 ? 's' : ''}</p>
            )}
          </div>
        ) : (
          <span className="text-xl font-bold text-shield-600">${listing.asking_price}</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm mb-4">
        {listing.state && (
          <div className="flex items-center gap-1.5 text-slate-600">
            <MapPin className="w-3.5 h-3.5" /> {listing.state} {listing.zip_prefix && `(${listing.zip_prefix}xx)`}
          </div>
        )}
        {listing.lead_score !== null && (
          <div className="flex items-center gap-1.5 text-slate-600">
            <Star className="w-3.5 h-3.5" /> Score: {listing.lead_score}/100
          </div>
        )}
        <div className="flex items-center gap-1.5 text-slate-600">
          <Clock className="w-3.5 h-3.5" /> {listing.days_old}d old
        </div>
        <div className="flex items-center gap-1.5 text-slate-600">
          <TrendingUp className="w-3.5 h-3.5" /> {listing.coverage_level || 'Standard'}
        </div>
        {listing.has_phone && (
          <div className="flex items-center gap-1.5 text-savings-600">
            <Phone className="w-3.5 h-3.5" /> Has phone
          </div>
        )}
        {listing.has_email && (
          <div className="flex items-center gap-1.5 text-savings-600">
            <Mail className="w-3.5 h-3.5" /> Has email
          </div>
        )}
      </div>

      {isAuction && listing.auction_ends_at && (
        <p className="text-xs text-amber-600 mb-3">
          <Clock className="w-3 h-3 inline mr-1" />
          Auction ends {new Date(listing.auction_ends_at).toLocaleDateString()}
        </p>
      )}

      {listing.seller_notes && (
        <p className="text-xs text-slate-500 mb-3 italic">{listing.seller_notes}</p>
      )}

      {listing.seller_agency && (
        <p className="text-xs text-slate-400 mb-3">From: {listing.seller_agency.name}</p>
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

  if (loading) return <div className="text-center py-12 text-slate-400">Loading transactions...</div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['all', 'bought', 'sold'] as const).map(t => (
          <button key={t} onClick={() => setTxType(t)}
            className={`px-3 py-1.5 text-sm rounded-lg ${txType === t ? 'bg-shield-100 text-shield-700 font-medium' : 'text-slate-500 hover:bg-slate-100'}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {transactions.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-slate-500">No transactions yet</p>
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
                  {tx.listing?.state && <span className="text-slate-500 text-sm">{tx.listing.state}</span>}
                </div>
                <div className="text-right">
                  <p className={`font-bold ${tx.direction === 'bought' ? 'text-red-600' : 'text-savings-600'}`}>
                    {tx.direction === 'bought' ? `-$${tx.purchase_price}` : `+$${tx.seller_payout}`}
                  </p>
                  <p className="text-xs text-slate-400">
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
