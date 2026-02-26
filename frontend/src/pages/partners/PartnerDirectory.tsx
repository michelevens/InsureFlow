import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, Badge, Button, Input, Modal } from '@/components/ui';
import { partnerMarketplaceService } from '@/services/api';
import type { PartnerListing } from '@/services/api/partnerMarketplace';
import {
  Handshake, Plus, Star, Globe, Phone, Mail, Filter, ExternalLink,
} from 'lucide-react';

export default function PartnerDirectory() {
  const [listings, setListings] = useState<PartnerListing[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<PartnerListing | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [data, cats] = await Promise.all([
          partnerMarketplaceService.list(activeCategory !== 'all' ? { category: activeCategory } : undefined),
          partnerMarketplaceService.categories(),
        ]);
        setListings(data.data);
        setCategories(cats);
      } catch {
        toast.error('Failed to load partner directory');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activeCategory]);

  const handleRefer = async (listingId: number) => {
    try {
      await partnerMarketplaceService.refer(listingId);
      toast.success('Client referral sent successfully');
    } catch {
      toast.error('Failed to send client referral');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Partner Directory</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Find complementary service providers for your clients</p>
        </div>
        <Button variant="shield" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-1" /> List Your Business
        </Button>
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
        <button
          onClick={() => setActiveCategory('all')}
          className={`text-sm px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${activeCategory === 'all' ? 'bg-shield-50 dark:bg-shield-900/30 text-shield-700 dark:text-shield-300 font-medium' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800'}`}
        >All</button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`text-sm px-3 py-1.5 rounded-full whitespace-nowrap transition-colors capitalize ${activeCategory === cat ? 'bg-shield-50 dark:bg-shield-900/30 text-shield-700 dark:text-shield-300 font-medium' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800'}`}
          >{cat}</button>
        ))}
      </div>

      {loading ? (
        <Card className="p-8 text-center">
          <div className="w-8 h-8 border-4 border-shield-200 border-t-shield-600 rounded-full animate-spin mx-auto" />
        </Card>
      ) : listings.length === 0 ? (
        <Card className="p-12 text-center">
          <Handshake className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 mb-4">No partners listed yet</p>
          <Button variant="shield" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1" /> Be the First
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map(listing => (
            <Card key={listing.id} className="p-5 hover:shadow-md transition-all">
              <div className="flex items-start gap-3 mb-3">
                {listing.logo_url ? (
                  <img src={listing.logo_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-shield-50 dark:bg-shield-900/30 flex items-center justify-center">
                    <Handshake className="w-6 h-6 text-shield-600 dark:text-shield-400" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-white">{listing.business_name}</h3>
                    {listing.is_verified && <Badge variant="success">Verified</Badge>}
                  </div>
                  <Badge variant="default">{listing.category}</Badge>
                </div>
              </div>
              {listing.description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">{listing.description}</p>
              )}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{listing.rating.toFixed(1)}</span>
                </div>
                <span className="text-xs text-slate-400 dark:text-slate-500">({listing.review_count} reviews)</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-3">
                {listing.website && (
                  <a href={listing.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-shield-600 dark:text-shield-400 hover:underline">
                    <Globe className="w-3 h-3" /> Website
                  </a>
                )}
                {listing.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {listing.phone}</span>}
              </div>
              <div className="flex gap-2">
                <Button variant="shield" size="sm" className="flex-1" onClick={() => handleRefer(listing.id)}>
                  Refer Client
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedPartner(listing)}>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selectedPartner && (
        <Modal isOpen onClose={() => setSelectedPartner(null)} title={selectedPartner.business_name} size="md">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="default">{selectedPartner.category}</Badge>
              {selectedPartner.is_verified && <Badge variant="success">Verified</Badge>}
            </div>
            {selectedPartner.description && <p className="text-sm text-slate-700 dark:text-slate-200">{selectedPartner.description}</p>}
            {selectedPartner.service_area && selectedPartner.service_area.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">Service Area</p>
                <div className="flex flex-wrap gap-1">
                  {selectedPartner.service_area.map(a => <span key={a} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">{a}</span>)}
                </div>
              </div>
            )}
            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              {selectedPartner.website && <div className="flex items-center gap-2"><Globe className="w-4 h-4" /> <a href={selectedPartner.website} target="_blank" rel="noopener noreferrer" className="text-shield-600 dark:text-shield-400 hover:underline">{selectedPartner.website}</a></div>}
              {selectedPartner.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4" /> {selectedPartner.phone}</div>}
              {selectedPartner.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4" /> {selectedPartner.email}</div>}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setSelectedPartner(null)}>Close</Button>
              <Button variant="shield" onClick={() => { handleRefer(selectedPartner.id); setSelectedPartner(null); }}>Refer a Client</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create listing modal */}
      {showCreate && (
        <CreateListingModal
          onClose={() => setShowCreate(false)}
          onCreated={(l) => { setListings(prev => [l, ...prev]); setShowCreate(false); }}
        />
      )}
    </div>
  );
}

function CreateListingModal({ onClose, onCreated }: { onClose: () => void; onCreated: (l: PartnerListing) => void }) {
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!businessName || !category) return;
    setSaving(true);
    try {
      const listing = await partnerMarketplaceService.create({ business_name: businessName, category, description, website: website || null });
      toast.success('Partner listing created successfully');
      onCreated(listing);
    } catch {
      toast.error('Failed to create partner listing');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="List Your Business" size="md">
      <div className="space-y-4">
        <Input label="Business Name" placeholder="Your Company LLC" value={businessName} onChange={e => setBusinessName(e.target.value)} />
        <Input label="Category" placeholder="Home Inspector, Financial Advisor, etc." value={category} onChange={e => setCategory(e.target.value)} />
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200 block mb-1">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full h-20 text-sm border border-slate-200 dark:border-slate-700/50 rounded-lg p-3 focus:ring-2 focus:ring-shield-500 dark:focus:ring-shield-400 focus:border-shield-500" placeholder="Describe your services..." />
        </div>
        <Input label="Website" placeholder="https://..." value={website} onChange={e => setWebsite(e.target.value)} />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="shield" onClick={handleSubmit} disabled={saving || !businessName || !category}>
            {saving ? 'Listing...' : 'Create Listing'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
