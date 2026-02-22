import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';
import {
  Calculator, Users, FileText, ShieldCheck, ArrowRight, Star,
  CheckCircle2, Building2, BarChart3, Route, Lock, Zap, Globe,
  UserCheck, PieChart, Network,
} from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Insurons" className="h-8 w-auto" />
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <a href="#consumers" className="text-sm text-slate-600 hover:text-slate-900">For Consumers</a>
            <a href="#agents" className="text-sm text-slate-600 hover:text-slate-900">For Agents</a>
            <a href="#agencies" className="text-sm text-slate-600 hover:text-slate-900">For Agencies</a>
            <Link to="/pricing" className="text-sm text-slate-600 hover:text-slate-900">Pricing</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login"><Button variant="ghost" size="sm">Sign In</Button></Link>
            <Link to="/calculator"><Button variant="shield" size="sm">Get Free Quotes</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-shield-50/50 via-white to-sky-50/30" />
        <div className="max-w-7xl mx-auto px-6 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-shield-50 text-shield-700 text-sm font-medium mb-6">
            <ShieldCheck className="w-4 h-4" />
            The Insurance Distribution Platform
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 max-w-5xl mx-auto leading-tight">
            One platform for <span className="text-shield-600">consumers</span>, <span className="text-shield-600">agents</span>, and <span className="text-shield-600">agencies</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto mt-6 leading-relaxed">
            Insurons connects insurance buyers with the right coverage through intelligent quote comparison, automated lead routing, and a complete broker operating system — all in one unified platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Link to="/calculator">
              <Button variant="shield" size="xl" rightIcon={<ArrowRight className="w-5 h-5" />}>
                Get Your Free Quote
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="outline" size="xl">Join as a Professional</Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-3xl mx-auto">
            {[
              { value: '50+', label: 'Carriers' },
              { value: '6', label: 'Insurance Types' },
              { value: '50', label: 'States Covered' },
              { value: '<60s', label: 'Quote Time' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl font-bold text-shield-600">{stat.value}</div>
                <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-4">How Insurons Works</h2>
          <p className="text-lg text-slate-500 text-center max-w-2xl mx-auto mb-12">From quote to coverage in four simple steps</p>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: <Calculator className="w-6 h-6" />, title: 'Get Instant Quotes', desc: 'Enter your info once and compare quotes from multiple top carriers side-by-side' },
              { icon: <Route className="w-6 h-6" />, title: 'Smart Matching', desc: 'Our routing engine connects you with the best-fit licensed agent for your needs' },
              { icon: <Users className="w-6 h-6" />, title: 'Expert Guidance', desc: 'Your matched agent guides you through options and handles the application' },
              { icon: <ShieldCheck className="w-6 h-6" />, title: 'Get Covered', desc: 'Your policy is bound, tracked, and managed — all in your Insurons dashboard' },
            ].map((step, i) => (
              <div key={i} className="text-center relative">
                <div className="w-14 h-14 rounded-2xl bg-shield-100 text-shield-600 flex items-center justify-center mx-auto mb-4">
                  {step.icon}
                </div>
                <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-shield-600 text-white text-xs font-bold flex items-center justify-center md:block hidden">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Consumers */}
      <section id="consumers" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-50 text-sky-700 text-xs font-semibold mb-4">
                <UserCheck className="w-3.5 h-3.5" /> FOR CONSUMERS
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Stop overpaying for insurance</h2>
              <p className="text-lg text-slate-600 mb-8">
                Compare quotes from top carriers in seconds. No phone calls, no spam — just transparent pricing and expert agents when you need them.
              </p>
              <div className="space-y-4">
                {[
                  'Instant quotes from 50+ carriers — auto, home, life, health, and more',
                  'Side-by-side comparison with coverage details and pricing',
                  'Get matched with a licensed agent who specializes in your needs',
                  'Track your policies, renewals, and claims in one dashboard',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-savings-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
              <Link to="/calculator" className="inline-block mt-8">
                <Button variant="shield" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Compare Quotes Now
                </Button>
              </Link>
            </div>
            <div className="bg-gradient-to-br from-sky-50 to-shield-50 rounded-2xl p-8 space-y-4">
              {[
                { carrier: 'SafeGuard Insurance', type: 'Auto', premium: '$127/mo', savings: 'Save $340/yr', rec: true },
                { carrier: 'National Shield', type: 'Auto', premium: '$142/mo', savings: 'Save $180/yr', rec: false },
                { carrier: 'Liberty First', type: 'Auto', premium: '$156/mo', savings: '', rec: false },
              ].map((q, i) => (
                <div key={i} className={`bg-white rounded-xl p-4 shadow-sm border ${q.rec ? 'border-shield-300 ring-1 ring-shield-100' : 'border-slate-100'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">{q.carrier}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{q.type} Insurance</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-slate-900">{q.premium}</div>
                      {q.savings && <div className="text-xs font-medium text-savings-600">{q.savings}</div>}
                    </div>
                  </div>
                  {q.rec && (
                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 bg-shield-50 text-shield-700 text-xs font-medium rounded-full">
                      <Star className="w-3 h-3 fill-shield-600" /> Best Match
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* For Agents */}
      <section id="agents" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 bg-gradient-to-br from-shield-50 to-white rounded-2xl p-8">
              <div className="space-y-3">
                {[
                  { stage: 'New Leads', count: 12, color: 'bg-blue-500' },
                  { stage: 'Contacted', count: 8, color: 'bg-amber-500' },
                  { stage: 'Quoted', count: 5, color: 'bg-purple-500' },
                  { stage: 'Application', count: 3, color: 'bg-shield-500' },
                  { stage: 'Policy Bound', count: 2, color: 'bg-savings-500' },
                ].map((s, i) => (
                  <div key={i} className="bg-white rounded-lg p-3 shadow-sm border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                      <span className="text-sm font-medium text-slate-700">{s.stage}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">{s.count}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-shield-50 rounded-lg text-center">
                <div className="text-xs text-shield-600 font-medium">Monthly Pipeline Value</div>
                <div className="text-xl font-bold text-shield-700 mt-1">$34,200</div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-shield-50 text-shield-700 text-xs font-semibold mb-4">
                <BarChart3 className="w-3.5 h-3.5" /> FOR AGENTS
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Your complete insurance CRM</h2>
              <p className="text-lg text-slate-600 mb-8">
                Stop juggling spreadsheets. Insurons delivers qualified leads directly to your pipeline with full CRM, commission tracking, and performance analytics.
              </p>
              <div className="space-y-4">
                {[
                  'Qualified leads auto-routed based on your specialties and location',
                  'Full pipeline CRM — track every lead from contact to policy bound',
                  'Commission tracking with carrier integration',
                  'Professional profile with ratings, reviews, and marketplace visibility',
                  'Unified Insurance Profiles — see every consumer\'s complete journey',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-savings-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
              <Link to="/register" className="inline-block mt-8">
                <Button variant="shield" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Join as an Agent
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* For Agencies */}
      <section id="agencies" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold mb-4">
                <Building2 className="w-3.5 h-3.5" /> FOR AGENCIES
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">The broker operating system</h2>
              <p className="text-lg text-slate-600 mb-8">
                Run your entire agency on Insurons. Multi-tenant team management, intelligent lead routing, embeddable widgets, and complete pipeline visibility across your organization.
              </p>
              <div className="space-y-4">
                {[
                  'Multi-tenant isolation — your data stays yours, completely separated',
                  'Configurable routing rules: round-robin, capacity-based, or direct assignment',
                  'Team management with role-based permissions (owner, admin, sales, designer)',
                  'Embeddable quote widget for your own website — leads auto-route to your agents',
                  'Agency-wide pipeline analytics and conversion tracking',
                  'White-label ready — your brand, powered by Insurons infrastructure',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
              <Link to="/register" className="inline-block mt-8">
                <Button variant="shield" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Start Your Agency
                </Button>
              </Link>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-shield-50 rounded-2xl p-8">
              <div className="text-sm font-semibold text-slate-700 mb-4">Agency Dashboard</div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: 'Active Leads', value: '127', icon: <Users className="w-4 h-4" /> },
                  { label: 'Policies Bound', value: '43', icon: <ShieldCheck className="w-4 h-4" /> },
                  { label: 'Team Members', value: '8', icon: <Network className="w-4 h-4" /> },
                  { label: 'Conversion', value: '34%', icon: <PieChart className="w-4 h-4" /> },
                ].map((m, i) => (
                  <div key={i} className="bg-white rounded-lg p-3 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-400 mb-1">{m.icon}<span className="text-xs">{m.label}</span></div>
                    <div className="text-lg font-bold text-slate-900">{m.value}</div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-100">
                <div className="text-xs text-slate-400 mb-2">Routing Rules</div>
                <div className="space-y-2">
                  {[
                    { name: 'Auto leads → Round Robin', status: 'Active', color: 'text-savings-600 bg-savings-50' },
                    { name: 'Home leads (90xxx) → J. Smith', status: 'Active', color: 'text-savings-600 bg-savings-50' },
                    { name: 'Life leads → Capacity-based', status: 'Active', color: 'text-savings-600 bg-savings-50' },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">{r.name}</span>
                      <span className={`px-2 py-0.5 rounded-full font-medium ${r.color}`}>{r.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform features */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">Built for the modern insurance industry</h2>
          <p className="text-lg text-slate-400 text-center max-w-2xl mx-auto mb-12">
            Enterprise-grade infrastructure that powers every step of the insurance distribution lifecycle
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: <Lock className="w-6 h-6" />, title: 'Tenant Isolation', desc: 'Complete data separation between agencies. Your clients, your data — always.' },
              { icon: <Route className="w-6 h-6" />, title: 'Intelligent Routing', desc: 'Auto-assign leads by geography, specialty, capacity, or custom rules.' },
              { icon: <FileText className="w-6 h-6" />, title: 'Unified Insurance Profiles', desc: 'One canonical record per consumer — from first quote to policy renewal.' },
              { icon: <Zap className="w-6 h-6" />, title: 'Real-Time Pipeline', desc: 'Track every opportunity through intake → quote → lead → application → policy.' },
              { icon: <Globe className="w-6 h-6" />, title: 'Embeddable Widgets', desc: 'Put a quote calculator on your agency website. Leads flow into your pipeline.' },
              { icon: <BarChart3 className="w-6 h-6" />, title: 'Analytics & Reporting', desc: 'Conversion rates, pipeline value, agent performance — all at a glance.' },
            ].map((f, i) => (
              <div key={i} className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                <div className="w-12 h-12 rounded-xl bg-shield-600/20 text-shield-400 flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Ready to transform your insurance workflow?</h2>
          <p className="text-lg text-slate-600 mb-8">
            Whether you're a consumer looking for the best rate, an agent growing your book, or an agency scaling operations — Insurons is built for you.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/calculator">
              <Button variant="shield" size="xl" rightIcon={<ArrowRight className="w-5 h-5" />}>
                Get Your Free Quote
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="outline" size="xl">Create Professional Account</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <img src="/logo.png" alt="Insurons" className="h-7 w-auto" />
              </div>
              <p className="text-sm text-slate-500">The unified insurance distribution platform for consumers, agents, and agencies.</p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 text-sm mb-3">Consumers</h4>
              <div className="space-y-2">
                <Link to="/calculator" className="block text-sm text-slate-500 hover:text-slate-700">Get Quotes</Link>
                <Link to="/marketplace" className="block text-sm text-slate-500 hover:text-slate-700">Find an Agent</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 text-sm mb-3">Professionals</h4>
              <div className="space-y-2">
                <Link to="/register" className="block text-sm text-slate-500 hover:text-slate-700">Join as Agent</Link>
                <Link to="/register" className="block text-sm text-slate-500 hover:text-slate-700">Start an Agency</Link>
                <Link to="/pricing" className="block text-sm text-slate-500 hover:text-slate-700">Pricing</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 text-sm mb-3">Company</h4>
              <div className="space-y-2">
                <Link to="/privacy" className="block text-sm text-slate-500 hover:text-slate-700">Privacy Policy</Link>
                <Link to="/terms" className="block text-sm text-slate-500 hover:text-slate-700">Terms of Service</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-200 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-sm text-slate-400">&copy; {new Date().getFullYear()} Insurons. All rights reserved.</span>
            <span className="text-xs text-slate-400">Insurons is a technology platform, not a licensed insurance agency.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
