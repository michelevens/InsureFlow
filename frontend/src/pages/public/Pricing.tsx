import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Badge } from '@/components/ui';
import { CheckCircle2, ArrowRight, Zap } from 'lucide-react';

const plans = [
  {
    name: 'Consumer',
    price: 'Free',
    period: '',
    description: 'Get quotes and find the right coverage',
    features: [
      'Instant quotes from 50+ carriers',
      'Side-by-side comparison',
      'Agent matching',
      'Policy tracking',
      'Email support',
    ],
    cta: 'Get Started Free',
    href: '/register',
    popular: false,
  },
  {
    name: 'Agent Basic',
    price: '$29',
    period: '/mo',
    description: 'Essential tools to grow your book',
    features: [
      'Up to 20 leads/month',
      'Basic CRM',
      'Commission tracking',
      'Marketplace listing',
      'Email support',
    ],
    cta: 'Start Free Trial',
    href: '/register',
    popular: false,
  },
  {
    name: 'Agent Pro',
    price: '$79',
    period: '/mo',
    description: 'Everything you need to scale',
    features: [
      'Unlimited leads',
      'Advanced CRM + pipeline',
      'Commission tracking',
      'Priority marketplace listing',
      'Analytics dashboard',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    href: '/register',
    popular: true,
  },
  {
    name: 'Agency',
    price: '$149',
    period: '/mo',
    description: 'Team management and analytics',
    features: [
      'Up to 5 agents included',
      'Team lead distribution',
      'Agency analytics',
      'White-label reports',
      'Bulk lead tools',
      'Dedicated support',
    ],
    cta: 'Contact Sales',
    href: '/register',
    popular: false,
  },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Insurons" className="h-16 w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login"><Button variant="ghost" size="sm">Sign In</Button></Link>
            <Link to="/register"><Button variant="shield" size="sm">Get Started</Button></Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Simple, transparent pricing</h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Choose the plan that fits your needs. Consumers always use Insurons for free.
          </p>

          {/* Annual toggle */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <span className={`text-sm ${!annual ? 'font-medium text-slate-900' : 'text-slate-500'}`}>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`w-11 h-6 rounded-full relative transition-colors ${annual ? 'bg-shield-500' : 'bg-slate-300'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 shadow-sm transition-all ${annual ? 'right-0.5' : 'left-0.5'}`} />
            </button>
            <span className={`text-sm ${annual ? 'font-medium text-slate-900' : 'text-slate-500'}`}>
              Annual <Badge variant="success" className="ml-1">Save 20%</Badge>
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map(plan => (
            <Card
              key={plan.name}
              className={`flex flex-col ${plan.popular ? 'border-shield-500 ring-1 ring-shield-500 relative' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="shield" className="px-3 py-1">
                    <Zap className="w-3.5 h-3.5 mr-1" /> Most Popular
                  </Badge>
                </div>
              )}
              <div className="p-6 flex-1">
                <h3 className="text-lg font-bold text-slate-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-bold text-slate-900">
                    {plan.price === 'Free' ? 'Free' : annual ? `$${Math.round(parseInt(plan.price.replace('$', '')) * 0.8)}` : plan.price}
                  </span>
                  {plan.period && <span className="text-slate-500">{plan.period}</span>}
                </div>
                <p className="text-sm text-slate-500 mb-6">{plan.description}</p>

                <div className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-savings-500 flex-shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-6 pt-0">
                <Link to={plan.href}>
                  <Button
                    variant={plan.popular ? 'shield' : 'outline'}
                    className="w-full"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
