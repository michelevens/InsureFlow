import { Link } from 'react-router-dom';
import { FileText, ArrowLeft } from 'lucide-react';

export default function Terms() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Insurons" className="h-14 w-auto" />
          </Link>
          <Link to="/" className="flex items-center gap-1 text-sm text-shield-600 hover:text-shield-700">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-shield-50 flex items-center justify-center">
            <FileText className="w-6 h-6 text-shield-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Terms of Service</h1>
            <p className="text-slate-500 text-sm">Last updated: February 22, 2026</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8 lg:p-10 space-y-8 text-sm text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing and using the Insurons platform ("Platform"), you accept and agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you must not access or use the Platform.
            </p>
            <p className="mt-2">
              These Terms apply to all users, including consumers, insurance agents, agency owners, carriers, and administrators.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">2. Description of Service</h2>
            <p>Insurons is an insurance marketplace platform that:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Connects consumers with licensed insurance agents and carriers</li>
              <li>Provides instant insurance quotes from multiple carriers</li>
              <li>Facilitates insurance application and policy management</li>
              <li>Offers CRM, analytics, and business tools for insurance professionals</li>
              <li>Provides market intelligence and data products</li>
            </ul>
            <p className="mt-2">
              Insurons is a technology platform and is not itself an insurance company, agent, or broker unless otherwise specifically stated. Insurance products are underwritten by licensed insurance carriers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">3. User Accounts</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>You must provide accurate and complete registration information</li>
              <li>You are responsible for maintaining the security of your account credentials</li>
              <li>You must notify us immediately of any unauthorized access to your account</li>
              <li>You may not share your account or allow others to access it</li>
              <li>We reserve the right to suspend or terminate accounts that violate these Terms</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">4. Insurance Professional Requirements</h2>
            <p>If you are an insurance agent, agency owner, or carrier using the Platform:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>You must hold all required licenses and certifications in the states where you operate</li>
              <li>You are responsible for complying with all applicable insurance laws and regulations</li>
              <li>You must provide accurate information about your qualifications and credentials</li>
              <li>You agree to maintain errors and omissions (E&O) insurance coverage</li>
              <li>You must not engage in any deceptive or unfair practices</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">5. Subscription Plans and Payments</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Certain features require a paid subscription plan</li>
              <li>Subscription fees are billed in advance on a monthly or annual basis</li>
              <li>You authorize us to charge your payment method for recurring fees</li>
              <li>Refunds are subject to our refund policy</li>
              <li>We may change subscription pricing with 30 days' notice</li>
              <li>Failure to pay may result in account suspension or downgrade</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">6. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Use the Platform for any unlawful purpose or in violation of any regulations</li>
              <li>Submit false, misleading, or fraudulent information</li>
              <li>Interfere with or disrupt the Platform's infrastructure</li>
              <li>Attempt to gain unauthorized access to any part of the Platform</li>
              <li>Scrape, harvest, or collect data from the Platform without authorization</li>
              <li>Use automated tools (bots, scrapers) to access the Platform</li>
              <li>Transmit viruses, malware, or other harmful code</li>
              <li>Harass, abuse, or threaten other users</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">7. Intellectual Property</h2>
            <p>
              The Platform, including its design, features, content, and underlying technology, is owned by Insurons and protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works without our written consent.
            </p>
            <p className="mt-2">
              You retain ownership of content you submit to the Platform but grant us a license to use, display, and distribute it as necessary to provide our services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">8. Disclaimers</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>The Platform is provided "as is" and "as available" without warranties of any kind</li>
              <li>We do not guarantee the accuracy of insurance quotes or coverage information</li>
              <li>Insurance quotes are estimates and actual premiums may differ</li>
              <li>We are not responsible for the actions or omissions of agents, carriers, or other users</li>
              <li>We do not provide insurance advice — consult a licensed professional for guidance</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Insurons shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities, arising from your use of the Platform.
            </p>
            <p className="mt-2">
              Our total liability for any claims arising from or related to the Platform shall not exceed the amount you paid us in the twelve (12) months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">10. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless Insurons, its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your use of the Platform or violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">11. Termination</h2>
            <p>
              We may terminate or suspend your access to the Platform at any time, with or without cause, and with or without notice. Upon termination, your right to use the Platform ceases immediately. Provisions that by their nature should survive termination shall survive.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">12. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of law provisions. Any disputes shall be resolved in the courts located in Delaware.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">13. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify you of material changes by posting the updated Terms on this page and updating the "Last updated" date. Your continued use of the Platform after changes constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">14. Contact Us</h2>
            <p>If you have questions about these Terms, please contact us at:</p>
            <div className="mt-2 bg-slate-50 rounded-xl p-4">
              <p className="font-medium text-slate-900">Insurons Legal Team</p>
              <p>Email: <a href="mailto:legal@insurons.com" className="text-shield-600 hover:underline">legal@insurons.com</a></p>
            </div>
          </section>
        </div>

        {/* Footer links */}
        <div className="flex items-center justify-center gap-6 mt-8 text-sm text-slate-500">
          <Link to="/privacy" className="hover:text-shield-600">Privacy Policy</Link>
          <span>|</span>
          <Link to="/" className="hover:text-shield-600">Home</Link>
        </div>
      </main>
    </div>
  );
}
