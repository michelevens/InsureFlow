import { Link } from 'react-router-dom';
import { ScrollText, ArrowLeft } from 'lucide-react';

export default function Disclosures() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt="Insurons" className="h-14 w-auto" />
          </Link>
          <Link to="/" className="flex items-center gap-1 text-sm text-shield-600 hover:text-shield-700">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-shield-50 flex items-center justify-center">
            <ScrollText className="w-6 h-6 text-shield-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Disclosures</h1>
            <p className="text-slate-500 text-sm">Last updated: February 27, 2026</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8 lg:p-10 space-y-8 text-sm text-slate-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">1. About Insurons</h2>
            <p>
              Insurons is a technology platform operated by EnnHealth LLC that connects consumers with licensed insurance agents and agencies. <strong>Insurons is not an insurance company, insurance carrier, or licensed insurance broker.</strong> Insurons does not underwrite, bind, or sell insurance policies.
            </p>
            <p className="mt-2">
              All insurance products and services displayed on the Insurons platform are offered and sold exclusively through independent licensed insurance agents and agencies who use the Insurons platform to manage their business operations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">2. Quotes and Estimates</h2>
            <p>
              Any insurance premium quotes, estimates, or rate comparisons displayed on the Insurons platform are provided for <strong>general informational and educational purposes only</strong> and are non-binding. These figures are estimates based on the information you provide and may not reflect the actual premium you will be offered.
            </p>
            <p className="mt-2">
              The final insurance policy premium for any policy is determined solely by the underwriting insurance company following a complete application and underwriting review. Actual premiums may vary based on your specific circumstances, location, claims history, credit information (where permitted by law), and other factors evaluated by the carrier.
            </p>
            <p className="mt-2">
              Insurons does not guarantee the accuracy, completeness, or availability of any quoted rate. Rates and coverage options are subject to change without notice.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">3. Insurance Products and Coverage</h2>
            <p>
              Insurance products displayed on the Insurons platform are offered through licensed agents and agencies that maintain their own carrier appointments. Not all insurance products, carriers, or coverage options are available in all states or through all agents on the platform.
            </p>
            <p className="mt-2">
              The availability of specific insurance products depends on your state of residence, the carriers appointed with your selected agent or agency, and applicable underwriting guidelines. Insurons does not represent or warrant that any particular insurance product or coverage will be available to you.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">4. Licensing and Regulation</h2>
            <p>
              Insurance agents and agencies on the Insurons platform are independently licensed in their respective states and are solely responsible for ensuring compliance with all applicable insurance licensing laws and regulations.
            </p>
            <p className="mt-2">
              Insurons does not verify, guarantee, or take responsibility for the licensing status, professional qualifications, or regulatory compliance of any agent, agency, or carrier listed on the platform. Consumers are encouraged to independently verify that their agent or agency holds a valid insurance license in their state through their state's Department of Insurance website.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">5. Compensation Disclosure</h2>
            <p>
              Insurons earns revenue through subscription fees paid by insurance agents and agencies who use the platform, as well as through technology service fees. Insurons may also receive referral fees or revenue-sharing arrangements from partner agencies for consumer leads generated through the platform.
            </p>
            <p className="mt-2">
              The order in which agents, agencies, or insurance quotes appear on the platform may be influenced by factors including but not limited to: subscription tier, geographic relevance, user ratings, response time, and commercial relationships. The display order does not constitute a recommendation or endorsement by Insurons.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">6. No Professional Advice</h2>
            <p>
              The information provided on the Insurons platform, including articles, calculators, comparison tools, and educational content, is for <strong>general informational purposes only</strong> and does not constitute professional insurance, financial, legal, or tax advice.
            </p>
            <p className="mt-2">
              You should consult with a licensed insurance professional, financial advisor, or attorney for advice specific to your individual circumstances. Insurons is not responsible for any decisions you make based on information obtained through the platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">7. Third-Party Content and Links</h2>
            <p>
              The Insurons platform may contain links to third-party websites, carrier portals, or external services. These links are provided for convenience only. Insurons does not control, endorse, or take responsibility for the content, privacy practices, or availability of any third-party website or service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">8. Embeddable Widgets</h2>
            <p>
              Insurons provides embeddable quote and recruitment widgets that partner agencies may place on their own websites. When you interact with an Insurons-powered widget on a third-party website:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Your information is transmitted to and processed by the Insurons platform</li>
              <li>The hosting agency's privacy policy may also apply</li>
              <li>Quotes generated through embedded widgets are subject to the same non-binding disclaimer described in Section 2</li>
              <li>Insurons' <Link to="/privacy" className="text-shield-600 hover:underline">Privacy Policy</Link> and <Link to="/terms" className="text-shield-600 hover:underline">Terms of Service</Link> govern your use of the widget</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">9. AI and Automated Tools</h2>
            <p>
              Insurons may use artificial intelligence, machine learning, and automated tools to enhance the user experience, including but not limited to: generating quote estimates, matching consumers with agents, and providing content recommendations. These tools are designed to assist — not replace — the guidance of licensed insurance professionals.
            </p>
            <p className="mt-2">
              Any AI-generated content, images, or recommendations on the platform are for illustrative purposes. Persons, scenarios, or testimonials depicted may be fictional and are not intended to represent real individuals unless explicitly stated.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">10. State-Specific Notices</h2>
            <p>
              Insurance regulations vary by state. Some states have specific disclosure requirements that may supplement or modify the general disclosures above. If you reside in a state with additional requirements, those requirements will be presented to you during the quoting or application process as applicable.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">11. Contact Us</h2>
            <p>
              If you have questions about these disclosures or need additional information, please contact us at:
            </p>
            <div className="mt-3 bg-slate-50 rounded-xl p-4">
              <p className="font-semibold text-slate-900">EnnHealth LLC — Insurons</p>
              <p className="mt-1">Email: <a href="mailto:legal@insurons.com" className="text-shield-600 hover:underline">legal@insurons.com</a></p>
              <p>Website: <a href="https://insurons.com" className="text-shield-600 hover:underline">insurons.com</a></p>
            </div>
          </section>
        </div>

        {/* Footer links */}
        <div className="mt-8 flex items-center justify-center gap-6 text-sm text-slate-500">
          <Link to="/privacy" className="hover:text-shield-600 transition-colors">Privacy Policy</Link>
          <span className="text-slate-300">|</span>
          <Link to="/terms" className="hover:text-shield-600 transition-colors">Terms of Service</Link>
          <span className="text-slate-300">|</span>
          <Link to="/" className="hover:text-shield-600 transition-colors">Home</Link>
        </div>
      </main>
    </div>
  );
}
