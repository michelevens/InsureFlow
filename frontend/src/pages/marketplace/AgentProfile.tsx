import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Card, Badge, Textarea } from '@/components/ui';
import {
  Shield, ShieldCheck, Star, MapPin, Phone, Clock, Award,
  ArrowLeft, MessageSquare, Calendar, Users, Briefcase,
} from 'lucide-react';

const mockAgent = {
  id: '1',
  name: 'Sarah Johnson',
  agency: 'Johnson Insurance Group',
  bio: 'With over 12 years of experience in the insurance industry, I specialize in finding the right coverage at the best price. I work with 15+ top-rated carriers to ensure my clients get personalized solutions that fit their unique needs.',
  specialties: ['Auto Insurance', 'Home Insurance', 'Life Insurance', 'Umbrella Insurance'],
  rating: 4.9,
  review_count: 127,
  years_experience: 12,
  city: 'Dallas',
  state: 'TX',
  phone: '(214) 555-0123',
  email: 'sarah@johnsoninsurance.com',
  website: 'www.johnsoninsurance.com',
  verified: true,
  carriers: ['StateFarm', 'Progressive', 'Allstate', 'Liberty Mutual', 'Geico', 'USAA'],
  licenses: ['Texas', 'Oklahoma', 'Arkansas', 'Louisiana'],
  response_time: '< 1 hour',
  clients_served: 2400,
  reviews: [
    { id: '1', author: 'Mike P.', rating: 5, text: 'Sarah found me an auto policy that saved me $300/year compared to what I was paying. Super responsive and professional.', date: '2026-02-15' },
    { id: '2', author: 'Lisa R.', rating: 5, text: 'She bundled my home and auto policies and saved me a ton. Highly recommend!', date: '2026-02-10' },
    { id: '3', author: 'James K.', rating: 4, text: 'Great service overall. She explained everything clearly and helped me understand my coverage options.', date: '2026-01-28' },
  ],
};

export default function AgentProfile() {
  const { id: _id } = useParams();
  const [showContact, setShowContact] = useState(false);
  const [message, setMessage] = useState('');

  const agent = mockAgent;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <nav className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gradient-shield flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">Insurons</span>
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
                    {agent.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl font-bold text-slate-900">{agent.name}</h1>
                      {agent.verified && (
                        <Badge variant="shield"><ShieldCheck className="w-3.5 h-3.5 mr-1" />Verified</Badge>
                      )}
                    </div>
                    <p className="text-slate-500 mb-3">{agent.agency}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="font-medium">{agent.rating}</span>
                        <span className="text-slate-400">({agent.review_count} reviews)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        {agent.city}, {agent.state}
                      </div>
                      <div className="flex items-center gap-1">
                        <Award className="w-4 h-4 text-slate-400" />
                        {agent.years_experience} years
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* About */}
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-3">About</h2>
                <p className="text-slate-600 leading-relaxed">{agent.bio}</p>
              </div>
            </Card>

            {/* Specialties */}
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

            {/* Carrier partners */}
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

            {/* Reviews */}
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-900">Reviews ({agent.review_count})</h2>
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                    <span className="text-lg font-bold text-slate-900">{agent.rating}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  {agent.reviews.map(review => (
                    <div key={review.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">{review.author}</span>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: review.rating }).map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-slate-400">{review.date}</span>
                      </div>
                      <p className="text-sm text-slate-600">{review.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact card */}
            <Card className="sticky top-6">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Contact {agent.name.split(' ')[0]}</h3>
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
                      placeholder="Hi Sarah, I'm looking for auto insurance and would love to discuss my options..."
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      rows={4}
                    />
                    <Button variant="shield" className="w-full">Send Message</Button>
                    <Button variant="ghost" className="w-full" onClick={() => setShowContact(false)}>Cancel</Button>
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Clock className="w-4 h-4 text-slate-400" />
                    Responds in {agent.response_time}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Users className="w-4 h-4 text-slate-400" />
                    {agent.clients_served.toLocaleString()} clients served
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    {agent.carriers.length} carrier partners
                  </div>
                </div>
              </div>
            </Card>

            {/* Licensed states */}
            <Card>
              <div className="p-6">
                <h3 className="font-semibold text-slate-900 mb-3">Licensed States</h3>
                <div className="flex flex-wrap gap-2">
                  {agent.licenses.map(l => (
                    <Badge key={l} variant="outline">{l}</Badge>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
