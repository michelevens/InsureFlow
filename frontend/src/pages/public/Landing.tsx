import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';
import { Shield, Calculator, Users, FileText, ShieldCheck, ArrowRight, Star, CheckCircle2 } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gradient-shield flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">InsureFlow</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link to="/calculator" className="text-sm text-slate-600 hover:text-slate-900">Get Quotes</Link>
            <Link to="/marketplace" className="text-sm text-slate-600 hover:text-slate-900">Find Agents</Link>
            <Link to="/pricing" className="text-sm text-slate-600 hover:text-slate-900">Pricing</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login"><Button variant="ghost" size="sm">Sign In</Button></Link>
            <Link to="/calculator"><Button variant="shield" size="sm">Get Free Quotes</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-shield-50 text-shield-700 text-sm font-medium mb-6">
            <ShieldCheck className="w-4 h-4" />
            Trusted by 10,000+ consumers and 500+ agents
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 max-w-4xl mx-auto leading-tight">
            Compare insurance quotes in <span className="text-shield-600">seconds</span>, not days
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mt-6">
            Get instant quotes from top carriers, compare side-by-side, and connect with licensed agents — all in one place. No phone calls, no waiting.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Link to="/calculator">
              <Button variant="shield" size="xl" rightIcon={<ArrowRight className="w-5 h-5" />}>
                Get Your Free Quote
              </Button>
            </Link>
            <Link to="/marketplace">
              <Button variant="outline" size="xl">Find an Agent</Button>
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-8 mt-12 text-slate-400">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-sm font-medium text-slate-600">4.9/5 Rating</span>
            </div>
            <div className="text-sm font-medium text-slate-600">50+ Carriers</div>
            <div className="text-sm font-medium text-slate-600">All 50 States</div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">How InsureFlow Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: <Calculator className="w-6 h-6" />, title: 'Enter Your Info', desc: 'Answer a few quick questions about your coverage needs' },
              { icon: <FileText className="w-6 h-6" />, title: 'Compare Quotes', desc: 'See side-by-side quotes from multiple top carriers instantly' },
              { icon: <Users className="w-6 h-6" />, title: 'Get Matched', desc: 'Connect with a licensed agent who specializes in your coverage type' },
              { icon: <ShieldCheck className="w-6 h-6" />, title: 'Get Covered', desc: 'Your agent handles the application and you\'re protected' },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-shield-100 text-shield-600 flex items-center justify-center mx-auto mb-4">
                  {step.icon}
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Agents */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">For Insurance Agents</h2>
              <p className="text-lg text-slate-600 mb-8">
                Get qualified leads, manage your pipeline, and grow your book of business — all from one platform.
              </p>
              <div className="space-y-4">
                {[
                  'Qualified leads delivered to your dashboard',
                  'CRM with activity tracking and follow-ups',
                  'Commission tracking and reporting',
                  'Professional profile with ratings and reviews',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-savings-500 flex-shrink-0" />
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
            <div className="bg-slate-100 rounded-2xl h-80 flex items-center justify-center text-slate-400">
              <Shield className="w-16 h-16" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-shield-600" />
            <span className="font-bold text-slate-900">InsureFlow</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link to="/privacy" className="hover:text-slate-700">Privacy</Link>
            <Link to="/terms" className="hover:text-slate-700">Terms</Link>
            <span>&copy; {new Date().getFullYear()} InsureFlow</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
