import { Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';

export default function Privacy() {
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
            <Shield className="w-6 h-6 text-shield-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Privacy Policy</h1>
            <p className="text-slate-500 text-sm">Last updated: February 22, 2026</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8 lg:p-10 space-y-8 text-sm text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">1. Introduction</h2>
            <p>
              Insurons ("we," "our," or "us") operates the Insurons insurance marketplace platform. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website, mobile application, and services (collectively, the "Platform").
            </p>
            <p className="mt-2">
              By accessing or using the Platform, you agree to this Privacy Policy. If you do not agree with the terms of this Privacy Policy, please do not access the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">2. Information We Collect</h2>
            <h3 className="font-semibold text-slate-800 mt-4 mb-2">Personal Information</h3>
            <p>We may collect personal information that you voluntarily provide, including:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Name, email address, phone number, and mailing address</li>
              <li>Date of birth and Social Security Number (for insurance applications)</li>
              <li>Insurance history and claims information</li>
              <li>Financial information (income, assets) for underwriting purposes</li>
              <li>Driver's license number and vehicle information (for auto insurance)</li>
              <li>Property details (for homeowners/renters insurance)</li>
              <li>Health information (for health and life insurance)</li>
              <li>Payment information (credit card, bank account details)</li>
            </ul>

            <h3 className="font-semibold text-slate-800 mt-4 mb-2">Automatically Collected Information</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Device information (browser type, operating system, device ID)</li>
              <li>IP address and geolocation data</li>
              <li>Usage data (pages visited, time spent, clickstream data)</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Provide, maintain, and improve our Platform and services</li>
              <li>Generate insurance quotes from multiple carriers</li>
              <li>Match you with licensed insurance agents</li>
              <li>Process insurance applications and policy transactions</li>
              <li>Communicate with you about your account, policies, and services</li>
              <li>Send marketing communications (with your consent)</li>
              <li>Detect, prevent, and address fraud and security issues</li>
              <li>Comply with legal and regulatory requirements</li>
              <li>Analyze usage patterns to improve user experience</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">4. Information Sharing</h2>
            <p>We may share your information with:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Insurance Carriers:</strong> To obtain quotes and process applications</li>
              <li><strong>Licensed Agents:</strong> To facilitate agent-consumer connections</li>
              <li><strong>Service Providers:</strong> Third parties who perform services on our behalf</li>
              <li><strong>Legal Requirements:</strong> When required by law, regulation, or legal process</li>
              <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
            </ul>
            <p className="mt-2">We do not sell your personal information to third parties for their own marketing purposes.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">5. Data Security</h2>
            <p>
              We implement appropriate technical and organizational security measures to protect your personal information, including encryption, access controls, and secure data storage. However, no method of transmission over the Internet or electronic storage is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">6. Your Rights and Choices</h2>
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Access, correct, or delete your personal information</li>
              <li>Opt out of marketing communications</li>
              <li>Request a copy of your data in a portable format</li>
              <li>Object to or restrict certain processing activities</li>
              <li>Withdraw consent where processing is based on consent</li>
            </ul>
            <p className="mt-2">To exercise these rights, contact us at <a href="mailto:privacy@insurons.com" className="text-shield-600 hover:underline">privacy@insurons.com</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">7. Cookies and Tracking</h2>
            <p>
              We use cookies and similar tracking technologies to enhance your experience. You can control cookie preferences through your browser settings. Disabling cookies may limit certain features of the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">8. Children's Privacy</h2>
            <p>
              The Platform is not intended for individuals under 18 years of age. We do not knowingly collect personal information from children under 18. If we learn that we have collected information from a child under 18, we will take steps to delete such information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date. Your continued use of the Platform after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">10. Contact Us</h2>
            <p>If you have questions about this Privacy Policy, please contact us at:</p>
            <div className="mt-2 bg-slate-50 rounded-xl p-4">
              <p className="font-medium text-slate-900">Insurons Privacy Team</p>
              <p>Email: <a href="mailto:privacy@insurons.com" className="text-shield-600 hover:underline">privacy@insurons.com</a></p>
            </div>
          </section>
        </div>

        {/* Footer links */}
        <div className="flex items-center justify-center gap-6 mt-8 text-sm text-slate-500">
          <Link to="/terms" className="hover:text-shield-600">Terms of Service</Link>
          <span>|</span>
          <Link to="/" className="hover:text-shield-600">Home</Link>
        </div>
      </main>
    </div>
  );
}
