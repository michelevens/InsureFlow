import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';
import { motion, useInView, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion';
import {
  Calculator, Users, ShieldCheck, ArrowRight, Star,
  CheckCircle2, Building2, BarChart3, Route, Lock, Zap, Globe,
  UserCheck, Car, Heart, Activity,
  Accessibility, Briefcase, Sparkles, Workflow, ListTodo, PenTool,
  Store, Mail, GraduationCap, Scale, Bot, Code2,
  ClipboardCheck, TrendingUp, Shield,
} from 'lucide-react';
import { api } from '@/services/api';
import { testimonialService, type Testimonial } from '@/services/api/testimonials';

/* ─── animation helpers ─── */
const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease } },
};

function Section({ children, className = '', delay = 0, id }: { children: React.ReactNode; className?: string; delay?: number; id?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.section
      ref={ref}
      id={id}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { delay, staggerChildren: 0.1 } } }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

function AnimatedCounter({ target, suffix = '', duration = 2 }: { target: number; suffix?: string; duration?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (inView) {
      const controls = animate(count, target, { duration, ease: 'easeOut' });
      return controls.stop;
    }
  }, [inView, target, duration, count]);

  useEffect(() => {
    const unsub = rounded.on('change', (v) => setDisplay(String(v)));
    return unsub;
  }, [rounded]);

  return <span ref={ref}>{display}{suffix}</span>;
}

/* ─── types ─── */
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

/* ─── platform screenshot carousel ─── */
const platformSlides = [
  { src: '/screenshots/1-calculator.svg', label: 'Quote Calculator', desc: 'Instant quotes from 50+ carriers' },
  { src: '/screenshots/2-quote-results.svg', label: 'Quote Results', desc: 'Side-by-side carrier comparison' },
  { src: '/screenshots/3-dashboard.svg', label: 'Agent Dashboard', desc: 'Full pipeline visibility & analytics' },
  { src: '/screenshots/4-crm-pipeline.svg', label: 'CRM Pipeline', desc: 'Kanban-style lead management' },
  { src: '/screenshots/5-marketplace.svg', label: 'Agent Marketplace', desc: 'Verified agent directory' },
  { src: '/screenshots/6-admin.svg', label: 'Admin Panel', desc: 'Platform oversight & revenue tracking' },
];

function PlatformScreenshotCarousel() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const advance = useCallback(() => {
    setCurrent(prev => (prev + 1) % platformSlides.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(advance, 4000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [paused, advance]);

  return (
    <motion.div
      variants={scaleIn}
      className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-purple-50 to-shield-50 shadow-lg"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Screenshot display */}
      <div className="relative aspect-[8/5] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.img
            key={current}
            src={platformSlides[current].src}
            alt={platformSlides[current].label}
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </AnimatePresence>
      </div>

      {/* Bottom bar with label + dots */}
      <div className="px-5 py-3 bg-white/90 backdrop-blur-sm flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-900">{platformSlides[current].label}</div>
          <div className="text-xs text-slate-500">{platformSlides[current].desc}</div>
        </div>
        <div className="flex items-center gap-1.5">
          {platformSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === current ? 'bg-shield-600 w-5' : 'bg-slate-300 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── main component ─── */
export default function Landing() {
  const [grouped, setGrouped] = useState<Record<string, VisibleProduct[]>>({});
  const [productCount, setProductCount] = useState(40);
  const [categoryCount, setCategoryCount] = useState(6);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    api.get<{ products: VisibleProduct[]; grouped: Record<string, VisibleProduct[]> }>('/products/visible')
      .then(res => {
        setGrouped(res.grouped || {});
        setProductCount(res.products?.length || 40);
        setCategoryCount(Object.keys(res.grouped || {}).length || 6);
      })
      .catch(() => { /* keep defaults */ });
    testimonialService.getPublished()
      .then(setTestimonials)
      .catch(() => { /* keep fallback */ });
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* ═══ Navbar ═══ */}
      <nav className="border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="Insurons" className="h-16 w-auto" />
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <a href="#consumers" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">For Consumers</a>
            <a href="#agents" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">For Agents</a>
            <a href="#agencies" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">For Agencies</a>
            <Link to="/pricing" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Pricing</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login"><Button variant="ghost" size="sm">Sign In</Button></Link>
            <Link to="/calculator"><Button variant="shield" size="sm">Get Free Quotes</Button></Link>
          </div>
        </div>
      </nav>

      {/* ═══ Hero ═══ */}
      <section className="py-24 lg:py-36 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-shield-950 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-shield-600/20 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-shield-500/8 rounded-full blur-3xl" />
        {/* Floating orbs */}
        <motion.div
          className="absolute top-20 left-[10%] w-72 h-72 bg-shield-500/10 rounded-full blur-3xl"
          animate={{ y: [0, -30, 0], x: [0, 15, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-10 right-[10%] w-96 h-96 bg-sky-500/8 rounded-full blur-3xl"
          animate={{ y: [0, 20, 0], x: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="max-w-7xl mx-auto px-6 text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-shield-300 text-sm font-medium mb-8 border border-white/10"
          >
            <ShieldCheck className="w-4 h-4" />
            The Complete Insurance Distribution Platform
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-white max-w-5xl mx-auto leading-[1.1] tracking-tight"
          >
            Insurance, <span className="bg-gradient-to-r from-shield-400 via-emerald-400 to-sky-400 bg-clip-text text-transparent">reimagined</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xl text-slate-300 max-w-2xl mx-auto mt-6 leading-relaxed"
          >
            Compare carriers in seconds. Manage leads with a full CRM. Automate your agency. One platform for consumers, agents, and agencies.
          </motion.p>

          {/* Single focused CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-10"
          >
            <Link to="/calculator">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Button variant="shield" size="xl" rightIcon={<ArrowRight className="w-5 h-5" />}>
                  Get Your Free Quote
                </Button>
              </motion.div>
            </Link>
            <p className="text-sm text-slate-500 mt-4">
              No signup required &middot; 60-second quotes &middot; 50+ carriers
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1, delayChildren: 0.8 } } }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-4xl mx-auto"
          >
            {[
              { value: 50, suffix: '+', label: 'Insurance Carriers' },
              { value: productCount, suffix: '+', label: 'Products' },
              { value: 495, suffix: '+', label: 'API Endpoints' },
              { value: 60, suffix: 's', prefix: '<', label: 'Quote Time' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                variants={scaleIn}
                whileHover={{ scale: 1.05, borderColor: 'rgba(255,255,255,0.2)' }}
                className="text-center p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 transition-colors"
              >
                <div className="text-3xl font-bold bg-gradient-to-r from-shield-400 to-emerald-400 bg-clip-text text-transparent">
                  {stat.prefix || ''}<AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm text-slate-400 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ How it works ═══ */}
      <Section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.h2 variants={fadeUp} className="text-3xl font-bold text-slate-900 text-center mb-4">How Insurons Works</motion.h2>
          <motion.p variants={fadeUp} className="text-lg text-slate-500 text-center max-w-2xl mx-auto mb-14">From quote to coverage in four simple steps</motion.p>
          <motion.div variants={stagger} className="grid md:grid-cols-4 gap-8">
            {[
              { icon: <Calculator className="w-6 h-6" />, title: 'Get Instant Quotes', desc: 'Enter your info once and compare quotes from multiple top carriers side-by-side' },
              { icon: <Route className="w-6 h-6" />, title: 'Smart Matching', desc: 'Our routing engine connects you with the best-fit licensed agent for your needs' },
              { icon: <Users className="w-6 h-6" />, title: 'Expert Guidance', desc: 'Your matched agent guides you through options and handles the application' },
              { icon: <ShieldCheck className="w-6 h-6" />, title: 'Get Covered', desc: 'Your policy is bound, tracked, and managed — all in your Insurons dashboard' },
            ].map((step, i) => (
              <motion.div key={i} variants={fadeUp} className="text-center relative group">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-14 h-14 rounded-2xl bg-shield-100 text-shield-600 flex items-center justify-center mx-auto mb-4 transition-shadow group-hover:shadow-lg group-hover:shadow-shield-200/50"
                >
                  {step.icon}
                </motion.div>
                <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-shield-600 text-white text-xs font-bold flex items-center justify-center md:block hidden">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* ═══ Insurance Products ═══ */}
      {Object.keys(grouped).length > 0 && (
        <Section className="py-20">
          <div className="max-w-7xl mx-auto px-6">
            <motion.h2 variants={fadeUp} className="text-3xl font-bold text-slate-900 text-center mb-4">Insurance Products We Cover</motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-slate-500 text-center max-w-2xl mx-auto mb-12">
              {productCount} products across {categoryCount} categories — all managed by our platform
            </motion.p>
            <motion.div variants={stagger} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(grouped).map(([category, products]) => (
                <motion.div
                  key={category}
                  variants={fadeUp}
                  whileHover={{ y: -4, borderColor: 'rgb(var(--shield-200))' }}
                  className="p-6 rounded-2xl border border-slate-200 hover:shadow-lg transition-shadow"
                >
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
                </motion.div>
              ))}
            </motion.div>
            <motion.div variants={fadeUp} className="text-center mt-10">
              <Link to="/calculator">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="inline-block">
                  <Button variant="shield" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Get a Quote for Any Product
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          </div>
        </Section>
      )}

      {/* ═══ For Consumers ═══ */}
      <Section id="consumers" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div variants={fadeUp}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-50 text-sky-700 text-xs font-semibold mb-4">
                <UserCheck className="w-3.5 h-3.5" /> FOR CONSUMERS
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Stop overpaying for insurance</h2>
              <p className="text-lg text-slate-600 mb-8">
                Compare quotes from top carriers in seconds. No phone calls, no spam — just transparent pricing and expert agents when you need them.
              </p>
              <motion.div variants={stagger} className="space-y-4">
                {[
                  'Instant quotes from 50+ carriers — auto, home, life, health, and more',
                  'Side-by-side comparison with coverage details and pricing',
                  'Get matched with a licensed agent who specializes in your needs',
                  'Track your policies, renewals, and claims in one dashboard',
                ].map((item, i) => (
                  <motion.div key={i} variants={fadeUp} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-savings-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">{item}</span>
                  </motion.div>
                ))}
              </motion.div>
              <Link to="/calculator" className="inline-block mt-8">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                  <Button variant="shield" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Compare Quotes Now
                  </Button>
                </motion.div>
              </Link>
            </motion.div>

            <motion.div variants={scaleIn} className="bg-gradient-to-br from-sky-50 to-shield-50 rounded-2xl p-8 space-y-4">
              {[
                { carrier: 'SafeGuard Insurance', type: 'Auto', premium: '$127/mo', savings: 'Save $340/yr', rec: true },
                { carrier: 'National Shield', type: 'Auto', premium: '$142/mo', savings: 'Save $180/yr', rec: false },
                { carrier: 'Liberty First', type: 'Auto', premium: '$156/mo', savings: '', rec: false },
              ].map((q, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                  whileHover={{ scale: 1.02 }}
                  className={`bg-white rounded-xl p-4 shadow-sm border cursor-pointer transition-shadow hover:shadow-md ${q.rec ? 'border-shield-300 ring-1 ring-shield-100' : 'border-slate-100'}`}
                >
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
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </Section>

      {/* ═══ For Agents ═══ */}
      <Section id="agents" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div variants={scaleIn} className="order-2 lg:order-1 bg-gradient-to-br from-shield-50 to-white rounded-2xl p-8">
              <motion.div variants={stagger} className="space-y-3">
                {[
                  { stage: 'New Leads', count: 12, color: 'bg-blue-500', width: '100%' },
                  { stage: 'Contacted', count: 8, color: 'bg-amber-500', width: '67%' },
                  { stage: 'Quoted', count: 5, color: 'bg-purple-500', width: '42%' },
                  { stage: 'Application', count: 3, color: 'bg-shield-500', width: '25%' },
                  { stage: 'Policy Bound', count: 2, color: 'bg-savings-500', width: '17%' },
                ].map((s, i) => (
                  <motion.div
                    key={i}
                    variants={fadeUp}
                    whileHover={{ x: 4 }}
                    className="bg-white rounded-lg p-3 shadow-sm border border-slate-100 flex items-center justify-between cursor-default"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                      <span className="text-sm font-medium text-slate-700">{s.stage}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                        <motion.div
                          className={`h-full rounded-full ${s.color}`}
                          initial={{ width: 0 }}
                          whileInView={{ width: s.width }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, delay: i * 0.1 }}
                        />
                      </div>
                      <span className="text-sm font-bold text-slate-900 w-6 text-right">{s.count}</span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
              <motion.div variants={fadeUp} className="mt-4 p-3 bg-shield-50 rounded-lg text-center">
                <div className="text-xs text-shield-600 font-medium">Monthly Pipeline Value</div>
                <div className="text-xl font-bold text-shield-700 mt-1">$<AnimatedCounter target={34200} duration={1.5} /></div>
              </motion.div>
            </motion.div>

            <motion.div variants={fadeUp} className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-shield-50 text-shield-700 text-xs font-semibold mb-4">
                <BarChart3 className="w-3.5 h-3.5" /> FOR AGENTS
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Your complete insurance CRM</h2>
              <p className="text-lg text-slate-600 mb-8">
                Stop juggling spreadsheets. Insurons delivers qualified leads directly to your pipeline with full CRM, commission tracking, and performance analytics.
              </p>
              <motion.div variants={stagger} className="space-y-4">
                {[
                  'Qualified leads auto-routed based on your specialties and location',
                  'Full CRM with kanban board — drag leads from contact to policy bound',
                  'Lead marketplace — buy qualified leads or sell your own surplus',
                  'Workflow automation — trigger actions on lead, application, and policy events',
                  'E-signatures, task management, commission tracking, and compliance pack',
                  'Professional profile with ratings, reviews, and marketplace visibility',
                ].map((item, i) => (
                  <motion.div key={i} variants={fadeUp} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-savings-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">{item}</span>
                  </motion.div>
                ))}
              </motion.div>
              <Link to="/register" className="inline-block mt-8">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                  <Button variant="shield" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Join as an Agent
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* ═══ For Agencies ═══ */}
      <Section id="agencies" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div variants={fadeUp}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold mb-4">
                <Building2 className="w-3.5 h-3.5" /> FOR AGENCIES
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">The broker operating system</h2>
              <p className="text-lg text-slate-600 mb-8">
                Run your entire agency on Insurons. Multi-tenant team management, intelligent lead routing, embeddable widgets, and complete pipeline visibility across your organization.
              </p>
              <motion.div variants={stagger} className="space-y-4">
                {[
                  'Multi-tenant isolation — your data stays yours, completely separated',
                  'Team management with role-based permissions and email invitations',
                  'Configurable lead routing: round-robin, capacity-based, or direct assignment',
                  'Embeddable quote widget — branded, on your website, leads flow to your pipeline',
                  'Email campaigns, recruitment, compliance tracking, and custom reports',
                  'White-label ready with custom domain, branding, and SSO integration',
                ].map((item, i) => (
                  <motion.div key={i} variants={fadeUp} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">{item}</span>
                  </motion.div>
                ))}
              </motion.div>
              <Link to="/register" className="inline-block mt-8">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                  <Button variant="shield" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Start Your Agency
                  </Button>
                </motion.div>
              </Link>
            </motion.div>

            <PlatformScreenshotCarousel />
          </div>
        </div>
      </Section>

      {/* ═══ Platform Features ═══ */}
      <Section className="py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-shield-900/30 via-transparent to-transparent" />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-shield-600/5 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="max-w-7xl mx-auto px-6 relative">
          <motion.div variants={fadeUp} className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-shield-300 text-sm font-medium mb-6">
              <Zap className="w-4 h-4" /> 14 Phases Built &amp; Deployed
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need. Nothing you don&apos;t.</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              From instant quotes to policy management — a complete insurance operating system in one platform.
            </p>
          </motion.div>
          <motion.div variants={stagger} className="grid md:grid-cols-3 lg:grid-cols-4 gap-5">
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
              <motion.div
                key={i}
                variants={fadeUp}
                whileHover={{ y: -6, borderColor: 'rgba(var(--shield-500), 0.4)' }}
                className="p-5 rounded-2xl bg-white/5 border border-white/10 transition-all duration-300 group cursor-default"
              >
                <motion.div
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  className="w-10 h-10 rounded-xl bg-shield-500/20 text-shield-400 flex items-center justify-center mb-3 group-hover:bg-shield-500/30 transition-colors"
                >
                  {f.icon}
                </motion.div>
                <h3 className="font-semibold text-white text-sm mb-1.5">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* ═══ Social Proof — consumer-facing metrics ═══ */}
      <Section className="py-16 bg-gradient-to-r from-shield-600 via-emerald-600 to-sky-600 relative overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <div className="max-w-7xl mx-auto px-6 relative">
          <motion.div variants={stagger} className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            {[
              { value: 50, suffix: '+', label: 'Insurance Carriers' },
              { value: 6, suffix: '', label: 'Product Categories' },
              { value: 60, suffix: 's', label: 'Average Quote Time' },
              { value: 0, suffix: '', label: 'Hidden Fees', static: '$0' },
            ].map((s, i) => (
              <motion.div key={i} variants={scaleIn}>
                <div className="text-4xl font-bold">
                  {s.static ? s.static : <AnimatedCounter target={s.value} suffix={s.suffix} />}
                </div>
                <div className="text-sm text-white/70 mt-1">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* ═══ Testimonials ═══ */}
      <Section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          {(() => {
            const items = testimonials.length > 0
              ? testimonials.map(t => ({
                  name: t.name,
                  role: [t.role, t.company].filter(Boolean).join(', '),
                  content: t.content,
                  rating: t.rating,
                }))
              : [{
                  name: 'Maria Gonzalez',
                  role: 'Agency Owner, Apex Insurance Group',
                  content: 'We switched from three different tools to Insurons. Our agents close 40% more policies and our compliance tracking went from chaos to automatic.',
                  rating: 5,
                }];
            const current = items[activeTestimonial % items.length];
            return (
              <motion.div variants={fadeUp} key={activeTestimonial}>
                <div className="flex items-center justify-center gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-6 h-6 ${i < current.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                  ))}
                </div>
                <blockquote className="text-2xl md:text-3xl font-medium text-slate-800 leading-relaxed mb-8">
                  &ldquo;{current.content}&rdquo;
                </blockquote>
                <div className="flex items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-shield-100 text-shield-600 flex items-center justify-center font-bold text-lg">
                    {current.name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-slate-900">{current.name}</div>
                    <div className="text-sm text-slate-500">{current.role}</div>
                  </div>
                </div>
                {items.length > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    {items.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveTestimonial(i)}
                        className={`w-2.5 h-2.5 rounded-full transition-colors ${
                          i === activeTestimonial % items.length
                            ? 'bg-shield-600'
                            : 'bg-slate-300 hover:bg-slate-400'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })()}
        </div>
      </Section>

      {/* ═══ CTA ═══ */}
      <Section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-shield-950 to-slate-900" />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-shield-500/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="max-w-4xl mx-auto px-6 text-center relative">
          <motion.div variants={fadeUp}>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Ready to transform how you <span className="bg-gradient-to-r from-shield-400 via-emerald-400 to-sky-400 bg-clip-text text-transparent">do insurance?</span>
            </h2>
            <p className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto">
              Join thousands of consumers, agents, and agencies already using Insurons. Start in 60 seconds — no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/calculator">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                  <Button variant="shield" size="xl" rightIcon={<ArrowRight className="w-5 h-5" />}>
                    Get Your Free Quote
                  </Button>
                </motion.div>
              </Link>
              <Link to="/register">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                  <Button variant="ghost" size="xl" className="text-white border-white/20 hover:bg-white/10">
                    Create Professional Account
                  </Button>
                </motion.div>
              </Link>
            </div>
            <div className="flex items-center justify-center gap-6 mt-8 text-sm text-slate-400">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Free to start</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> No credit card</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Cancel anytime</span>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* ═══ Footer ═══ */}
      <footer className="border-t border-slate-200 py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <img src="/logo.svg" alt="Insurons" className="h-14 w-auto" />
              </div>
              <p className="text-sm text-slate-500">The unified insurance distribution platform for consumers, agents, and agencies.</p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 text-sm mb-3">Consumers</h4>
              <div className="space-y-2">
                <Link to="/calculator" className="block text-sm text-slate-500 hover:text-slate-700 transition-colors">Get Quotes</Link>
                <Link to="/marketplace" className="block text-sm text-slate-500 hover:text-slate-700 transition-colors">Find an Agent</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 text-sm mb-3">Professionals</h4>
              <div className="space-y-2">
                <Link to="/register" className="block text-sm text-slate-500 hover:text-slate-700 transition-colors">Join as Agent</Link>
                <Link to="/register" className="block text-sm text-slate-500 hover:text-slate-700 transition-colors">Start an Agency</Link>
                <Link to="/pricing" className="block text-sm text-slate-500 hover:text-slate-700 transition-colors">Pricing</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 text-sm mb-3">Company</h4>
              <div className="space-y-2">
                <Link to="/privacy" className="block text-sm text-slate-500 hover:text-slate-700 transition-colors">Privacy Policy</Link>
                <Link to="/terms" className="block text-sm text-slate-500 hover:text-slate-700 transition-colors">Terms of Service</Link>
                <Link to="/disclosures" className="block text-sm text-slate-500 hover:text-slate-700 transition-colors">Disclosures</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-200 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-sm text-slate-400">&copy; {new Date().getFullYear()} Insurons. All rights reserved.</span>
            <span className="text-xs text-slate-400">Insurons is a technology platform operated by Acsyom Analytics LLC. Insurons is not an insurance company and does not sell or underwrite insurance. Quotes are estimates and are non-binding. <Link to="/disclosures" className="underline hover:text-slate-500">Disclosures</Link></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
