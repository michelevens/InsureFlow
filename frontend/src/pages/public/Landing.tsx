import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';
import {
  Calculator, Users, ShieldCheck, ArrowRight, Star,
  CheckCircle2, Building2, BarChart3, Route, Lock, Zap, Globe,
  UserCheck, PieChart, Network, Car, Heart, Activity,
  Accessibility, Briefcase, Sparkles, Workflow, ListTodo, PenTool,
  Store, Mail, GraduationCap, Scale, Bot, Code2,
  ClipboardCheck, TrendingUp, Shield,
} from 'lucide-react';
import { api } from '@/services/api';

interface VisibleProduct {
  id: number;
  slug: string;
  name: string;
  category: string;
  icon: string | null;
  is_active: boolean;
}

const categoryIcons: Record<string, React.ReactNode> = {
  'Personal Lines': <Car className="w-6 h-6" />,
  'Life Insurance': <Heart className="w-6 h-6" />,
  'Health Insurance': <Activity className="w-6 h-6" />,
  'Disability & Long-Term Care': <Accessibility className="w-6 h-6" />,
  'Commercial Lines': <Briefcase className="w-6 h-6" />,
  'Specialty': <Sparkles className="w-6 h-6" />,
};

export default function Landing() {
  const [grouped, setGrouped] = useState<Record<string, VisibleProduct[]>>({});
  const [productCount, setProductCount] = useState(40);
  const [categoryCount, setCategoryCount] = useState(6);

  useEffect(() => {
    api.get<{ products: VisibleProduct[]; grouped: Record<string, VisibleProduct[]> }>('/products/visible')
      .then(res => {
        setGrouped(res.grouped || {});
        setProductCount(res.products?.length || 40);
        setCategoryCount(Object.keys(res.grouped || {}).length || 6);
      })
      .catch(() => { /* keep defaults */ });
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Insurons" className="h-16 w-auto" />
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
      <section className="py-20 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-shield-950 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-shield-600/20 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-shield-500/10 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto px-6 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-shield-300 text-sm font-medium mb-8 border border-white/10">
            <ShieldCheck className="w-4 h-4" />
            The Complete Insurance Distribution Platform
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white max-w-5xl mx-auto leading-[1.1] tracking-tight">
            Insurance, <span className="bg-gradient-to-r from-shield-400 to-sky-400 bg-clip-text text-transparent">reimagined</span> for everyone
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto mt-6 leading-relaxed">
            Compare 50+ carriers in seconds. Manage leads with a full CRM. Automate your entire agency workflow. Insurons is the platform where consumers find coverage, agents grow their book, and agencies scale operations.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Link to="/calculator">
              <Button variant="shield" size="xl" rightIcon={<ArrowRight className="w-5 h-5" />}>
                Get Your Free Quote
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="ghost" size="xl" className="text-white border-white/20 hover:bg-white/10">
                Join as a Professional
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-4xl mx-auto">
            {[
              { value: '50+', label: 'Insurance Carriers' },
              { value: String(productCount) + '+', label: 'Products' },
              { value: '495+', label: 'API Endpoints' },
              { value: '<60s', label: 'Quote Time' },
            ].map((stat, i) => (
              <div key={i} className="text-center p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
                <div className="text-3xl font-bold bg-gradient-to-r from-shield-400 to-sky-400 bg-clip-text text-transparent">{stat.value}</div>
                <div className="text-sm text-slate-400 mt-1">{stat.label}</div>
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

      {/* Insurance Products — dynamic from admin-managed catalog */}
      {Object.keys(grouped).length > 0 && (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-slate-900 text-center mb-4">Insurance Products We Cover</h2>
            <p className="text-lg text-slate-500 text-center max-w-2xl mx-auto mb-12">
              {productCount} products across {categoryCount} categories — all managed by our platform
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(grouped).map(([category, products]) => (
                <div key={category} className="p-6 rounded-2xl border border-slate-200 hover:border-shield-200 hover:shadow-lg transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-shield-50 text-shield-600 flex items-center justify-center">
                      {categoryIcons[category] || <ShieldCheck className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{category}</h3>
                      <span className="text-xs text-slate-400">{products.length} product{products.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {products.map(p => (
                      <span key={p.id} className="inline-block px-2.5 py-1 rounded-full bg-slate-50 text-xs text-slate-600 border border-slate-100">
                        {p.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link to="/calculator">
                <Button variant="shield" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Get a Quote for Any Product
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

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
                  'Full CRM with kanban board — drag leads from contact to policy bound',
                  'Lead marketplace — buy qualified leads or sell your own surplus',
                  'Workflow automation — trigger actions on lead, application, and policy events',
                  'E-signatures, task management, commission tracking, and compliance pack',
                  'Professional profile with ratings, reviews, and marketplace visibility',
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
                  'Team management with role-based permissions and email invitations',
                  'Configurable lead routing: round-robin, capacity-based, or direct assignment',
                  'Embeddable quote widget — branded, on your website, leads flow to your pipeline',
                  'Email campaigns, recruitment, compliance tracking, and custom reports',
                  'White-label ready with custom domain, branding, and SSO integration',
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
      <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-shield-900/30 via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-shield-300 text-sm font-medium mb-6 mx-auto block w-fit">
            <Zap className="w-4 h-4" /> 14 Phases Built &amp; Deployed
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Everything you need. Nothing you don&apos;t.</h2>
          <p className="text-lg text-slate-400 text-center max-w-2xl mx-auto mb-14">
            From instant quotes to policy management — a complete insurance operating system in one platform.
          </p>
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[
              { icon: <Calculator className="w-5 h-5" />, title: 'Multi-Carrier Quoting', desc: 'Compare 50+ carriers with real-time premium breakdowns in under 60 seconds.' },
              { icon: <Route className="w-5 h-5" />, title: 'Intelligent Lead Routing', desc: 'Auto-assign by geography, specialty, capacity, or custom round-robin rules.' },
              { icon: <ListTodo className="w-5 h-5" />, title: 'CRM with Kanban Board', desc: 'Full pipeline management — drag leads through stages from new to bound.' },
              { icon: <Store className="w-5 h-5" />, title: 'Lead Marketplace', desc: 'Buy qualified leads or sell surplus. Auction bidding with smart pricing.' },
              { icon: <Workflow className="w-5 h-5" />, title: 'Workflow Automation', desc: '22 trigger events, 8 action types. Build rules that run your business for you.' },
              { icon: <PenTool className="w-5 h-5" />, title: 'E-Signatures', desc: 'Send applications for signing. Canvas signatures, no login needed.' },
              { icon: <ClipboardCheck className="w-5 h-5" />, title: 'Task Management', desc: 'Create, assign, and track tasks with priorities, due dates, and completion.' },
              { icon: <TrendingUp className="w-5 h-5" />, title: 'Commission Tracking', desc: 'Per-policy commissions, splits, Stripe Connect payouts, and revenue trends.' },
              { icon: <Scale className="w-5 h-5" />, title: 'Compliance Pack', desc: 'Licenses, CE credits, E&O tracking with automated expiration alerts.' },
              { icon: <Globe className="w-5 h-5" />, title: 'Embeddable Widget', desc: 'One script tag on any partner site. Inline or floating button mode.' },
              { icon: <Mail className="w-5 h-5" />, title: 'Email Campaigns', desc: 'Templates, drip sequences, scheduling, and per-recipient analytics.' },
              { icon: <Code2 className="w-5 h-5" />, title: 'White-Label & API', desc: 'Custom domain, branding, SSO. Plus webhooks and full REST API access.' },
              { icon: <Lock className="w-5 h-5" />, title: 'Tenant Isolation', desc: 'Complete data separation. SOC 2-grade audit logs with old/new diffs.' },
              { icon: <Bot className="w-5 h-5" />, title: 'AI Chat Assistant', desc: 'Conversational AI for agents — get answers, suggestions, and insights.' },
              { icon: <GraduationCap className="w-5 h-5" />, title: 'Training & Community', desc: 'Training catalog, discussion forum, events, and partner referral marketplace.' },
              { icon: <Shield className="w-5 h-5" />, title: 'Carrier API Adapters', desc: 'Plug in any carrier API — GenericRest, Progressive, Travelers, and more.' },
            ].map((f, i) => (
              <div key={i} className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-shield-500/30 transition-all duration-300 group">
                <div className="w-10 h-10 rounded-xl bg-shield-500/20 text-shield-400 flex items-center justify-center mb-3 group-hover:bg-shield-500/30 transition-colors">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-white text-sm mb-1.5">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Numbers */}
      <section className="py-16 bg-gradient-to-r from-shield-600 to-sky-600">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            {[
              { value: '82+', label: 'Database Models' },
              { value: '65+', label: 'Frontend Pages' },
              { value: '91', label: 'DB Migrations' },
              { value: '6', label: 'User Roles' },
            ].map((s, i) => (
              <div key={i}>
                <div className="text-4xl font-bold">{s.value}</div>
                <div className="text-sm text-white/70 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-shield-50 via-white to-sky-50" />
        <div className="max-w-4xl mx-auto px-6 text-center relative">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">The insurance industry has too many middlemen.<br />We built the platform that removes them.</h2>
          <p className="text-lg text-slate-600 mb-8">
            Consumers get instant quotes. Agents get qualified leads. Agencies get a complete operating system. One platform. Zero friction.
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
                <img src="/logo.png" alt="Insurons" className="h-14 w-auto" />
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
