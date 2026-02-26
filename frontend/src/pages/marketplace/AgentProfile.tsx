import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Card, Badge, Textarea } from '@/components/ui';
import { api } from '@/services/api/client';
import {
  ShieldCheck, Star, MapPin, Phone, Clock, Award,
  ArrowLeft, MessageSquare, Calendar, Users, Briefcase, Loader2,
} from 'lucide-react';

interface AgentData {
  id: number;
  user_id: number;
  bio: string | null;
  license_states: string[];
  specialties: string[];
  carriers: string[];
  years_experience: number;
  avg_rating: number;
  review_count: number;
  clients_served: number;
  city: string | null;
  state: string | null;
  response_time: string | null;
  npn_verified: boolean;
  user: { id: number; name: string; email: string };
  reviews: {
    id: number;
    rating: number;
    comment: string | null;
    agent_reply: string | null;
    created_at: string;
    user: { id: number; name: string };
  }[];
}

export default function AgentProfile() {
  const { id } = useParams<{ id: string }>();
  const [agent, setAgent] = useState<AgentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get<AgentData>(`/marketplace/agents/${id}`)
      .then(data => setAgent(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-shield-600" />
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <p className="text-slate-500">Agent not found</p>
        <Link to="/marketplace"><Button variant="outline">Back to Marketplace</Button></Link>
      </div>
    );
  }

  const name = agent.user?.name ?? 'Agent';
  const initials = name.split(' ').map(n => n[0]).join('');

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <nav className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="Insurons" className="h-16 w-auto" />
          </Link>
          <Link to="/marketplace">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>Back to Agents</Button>
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile header */}
            <Card>
              <div className="p-8">
                <div className="flex items-start gap-6">
                  <div className="w-20 h-20 rounded-2xl gradient-shield flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl font-bold text-slate-900">{name}</h1>
                      {agent.npn_verified && (
                        <Badge variant="shield"><ShieldCheck className="w-3.5 h-3.5 mr-1" />Verified</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 mt-2">
                      {agent.avg_rating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <span className="font-medium">{agent.avg_rating}</span>
                          <span className="text-slate-400">({agent.review_count} reviews)</span>
                        </div>
                      )}
                      {agent.city && agent.state && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          {agent.city}, {agent.state}
                        </div>
                      )}
                      {agent.years_experience > 0 && (
                        <div className="flex items-center gap-1">
                          <Award className="w-4 h-4 text-slate-400" />
                          {agent.years_experience} years
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* About */}
            {agent.bio && (
              <Card>
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-3">About</h2>
                  <p className="text-slate-600 leading-relaxed">{agent.bio}</p>
                </div>
              </Card>
            )}

            {/* Specialties */}
            {agent.specialties?.length > 0 && (
              <Card>
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-3">Specialties</h2>
                  <div className="flex flex-wrap gap-2">
                    {agent.specialties.map(s => (
                      <Badge key={s} variant="outline" className="text-sm px-3 py-1.5">{s}</Badge>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Carrier partners */}
            {agent.carriers?.length > 0 && (
              <Card>
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-3">Carrier Partners</h2>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    {agent.carriers.map(c => (
                      <div key={c} className="h-16 bg-slate-50 rounded-xl flex items-center justify-center text-sm font-medium text-slate-600 border border-slate-100">
                        {c}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Reviews */}
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-900">Reviews ({agent.review_count})</h2>
                  {agent.avg_rating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                      <span className="text-lg font-bold text-slate-900">{agent.avg_rating}</span>
                    </div>
                  )}
                </div>
                {agent.reviews?.length > 0 ? (
                  <div className="space-y-4">
                    {agent.reviews.map(review => (
                      <div key={review.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900">{review.user?.name ?? 'Anonymous'}</span>
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: review.rating }).map((_, i) => (
                                <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                              ))}
                            </div>
                          </div>
                          <span className="text-xs text-slate-400">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {review.comment && <p className="text-sm text-slate-600">{review.comment}</p>}
                        {review.agent_reply && (
                          <div className="mt-2 pl-4 border-l-2 border-shield-200">
                            <p className="text-sm text-slate-500 italic">{review.agent_reply}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">No reviews yet</p>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact card */}
            <Card className="sticky top-6">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Contact {name.split(' ')[0]}</h3>
                {!showContact ? (
                  <div className="space-y-3">
                    <Button variant="shield" className="w-full" onClick={() => setShowContact(true)}>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Send Message
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Phone className="w-4 h-4 mr-2" />
                      Call Agent
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule Meeting
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Textarea
                      placeholder={`Hi ${name.split(' ')[0]}, I'm looking for insurance and would love to discuss my options...`}
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      rows={4}
                    />
                    <Button variant="shield" className="w-full">Send Message</Button>
                    <Button variant="ghost" className="w-full" onClick={() => setShowContact(false)}>Cancel</Button>
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                  {agent.response_time && (
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <Clock className="w-4 h-4 text-slate-400" />
                      Responds in {agent.response_time}
                    </div>
                  )}
                  {agent.clients_served > 0 && (
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <Users className="w-4 h-4 text-slate-400" />
                      {agent.clients_served.toLocaleString()} clients served
                    </div>
                  )}
                  {agent.carriers?.length > 0 && (
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <Briefcase className="w-4 h-4 text-slate-400" />
                      {agent.carriers.length} carrier partners
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Licensed states */}
            {agent.license_states?.length > 0 && (
              <Card>
                <div className="p-6">
                  <h3 className="font-semibold text-slate-900 mb-3">Licensed States</h3>
                  <div className="flex flex-wrap gap-2">
                    {agent.license_states.map(l => (
                      <Badge key={l} variant="outline">{l}</Badge>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
