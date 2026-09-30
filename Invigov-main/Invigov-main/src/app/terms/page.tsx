import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - INVIGOV",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Image src="/logo.png" alt="INVIGOV" width={32} height={32} unoptimized />
            <span className="font-bold text-gray-900">INVIGOV</span>
          </Link>
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-10">Last Updated: March 25, 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-sm leading-relaxed text-gray-700">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the INVIGOV platform (the &quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;) and our Privacy Policy, incorporated herein by reference. If you do not agree to these Terms, you may not access or use the Service. These Terms constitute a binding legal agreement between you and INVIGOV LLC, a Texas limited liability company and wholly-owned subsidiary of Soventi Holdings Inc., a Delaware corporation (&quot;INVIGOV,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Description of Service</h2>
            <p>
              INVIGOV provides a federal compliance automation platform that assists businesses with SAM.gov registration, compliance document generation, and deadline tracking. The Service includes:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Guided SAM.gov registration workflow</li>
              <li>Automated generation of compliance documents (SAM Checklist, Representations &amp; Certifications, Banking Authorization Letter)</li>
              <li>Compliance deadline monitoring and multi-channel email alerts</li>
              <li>Secure encrypted document storage and retrieval</li>
            </ul>
            <p className="mt-2">
              The Service operates as a technology tool only. INVIGOV does not submit documents to SAM.gov or any government system on your behalf unless explicitly stated otherwise in a separate written agreement.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Account Registration</h2>
            <p>To access the Service, you must create an account by providing accurate, current, and complete information. You are solely responsible for:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account, whether or not authorized by you</li>
              <li>Notifying us immediately at <a href="mailto:support@invigov.com" className="text-blue-600 hover:underline">support@invigov.com</a> of any unauthorized use of your account</li>
            </ul>
            <p className="mt-2">We reserve the right to disable any account at any time if we have reason to believe account credentials have been compromised or these Terms have been violated.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Subscription Plans, Payment, and Refunds</h2>

            <h3 className="text-base font-medium text-gray-800 mb-2">4.1 Subscription Tiers</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Free</strong> &mdash; Basic access at no cost</li>
              <li><strong>Intelligence</strong> &mdash; $199/month, advanced compliance monitoring and deadline management</li>
              <li><strong>Complete</strong> &mdash; $279/month, full SAM.gov automation, document generation, and compliance suite</li>
            </ul>

            <h3 className="text-base font-medium text-gray-800 mt-4 mb-2">4.2 Billing and Renewal</h3>
            <p>
              All payments are processed securely through Stripe. Paid subscriptions renew automatically at the end of each billing cycle unless canceled. By providing payment information, you authorize us to charge your payment method on a recurring basis. We reserve the right to modify pricing with thirty (30) days&apos; prior notice to active subscribers.
            </p>

            <h3 className="text-base font-medium text-gray-800 mt-4 mb-2">4.3 Cancellation</h3>
            <p>
              You may cancel your subscription at any time through your account dashboard or by contacting <a href="mailto:support@invigov.com" className="text-blue-600 hover:underline">support@invigov.com</a>. Access to paid features will continue until the end of your current billing period. Cancellation does not entitle you to a refund for any portion of the current billing period already paid.
            </p>

            <h3 className="text-base font-medium text-gray-800 mt-4 mb-2">4.4 Refund Policy</h3>
            <p>
              All fees are non-refundable except as required by applicable law or as expressly stated herein. If a documented platform failure directly prevents you from accessing a core feature of your paid plan for more than seventy-two (72) consecutive hours and INVIGOV is unable to restore access within that period, you may request a pro-rated credit for the affected period by contacting <a href="mailto:support@invigov.com" className="text-blue-600 hover:underline">support@invigov.com</a> within seven (7) days of the incident. Credits are issued at INVIGOV&apos;s sole discretion and do not constitute a waiver of the limitation of liability set forth in Section 9.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Acceptable Use</h2>
            <p>You agree not to use the Service to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Submit false, fraudulent, or materially inaccurate information, including false FAR/DFARS representations or certifications to any government system</li>
              <li>Violate any applicable federal, state, or local law or regulation, including the Federal Acquisition Regulation (FAR), the False Claims Act, or any anti-fraud statute</li>
              <li>Reverse-engineer, decompile, disassemble, or attempt to derive the source code of the Service</li>
              <li>Access or attempt to access accounts, systems, or data belonging to other users</li>
              <li>Use automated scripts, bots, or crawlers to access the Service without prior written consent</li>
              <li>Resell, sublicense, or otherwise transfer your access rights to any third party without our written consent</li>
              <li>Upload or transmit any malicious code, virus, or disruptive technology</li>
            </ul>
            <p className="mt-2">We reserve the right to immediately terminate access and report to relevant federal authorities any use of the Service to submit false federal certifications or to facilitate procurement fraud.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Data Accuracy and User Responsibility</h2>
            <p>
              You are solely responsible for the accuracy, completeness, and legality of all information submitted through the Service, including but not limited to business identity information, NAICS codes, banking details, and all FAR/DFARS representations and certifications. INVIGOV generates documents based entirely on the information you provide and does not independently verify, validate, or confirm its accuracy against any government database or regulatory standard.
            </p>
            <p className="mt-2">
              You acknowledge that submitting false or materially inaccurate certifications through any federal procurement system may constitute a violation of federal law, including 18 U.S.C. &sect; 1001 and the False Claims Act (31 U.S.C. &sect; 3729 et seq.), and that INVIGOV bears no liability for consequences arising from your submission of inaccurate information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Government Systems Disclaimer</h2>
            <p>
              The Service depends in part on third-party government systems, including but not limited to SAM.gov, operated by the U.S. General Services Administration (GSA). INVIGOV has no control over the availability, accuracy, schema structure, or performance of SAM.gov or any other government system. We expressly disclaim any liability for:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Delays, rejections, or errors arising from government system downtime or schema changes</li>
              <li>Changes to SAM.gov registration requirements, processes, or standards made by GSA</li>
              <li>Rejection, suspension, or deactivation of your SAM.gov registration by any government authority</li>
              <li>Loss of contract eligibility, bid disqualification, or payment holds caused by government system behavior</li>
            </ul>
            <p className="mt-2">INVIGOV does not guarantee acceptance, approval, or activation of any SAM.gov registration. Your compliance status is determined solely by GSA and applicable federal regulations, not by INVIGOV.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Disclaimer of Warranties</h2>
            <p className="uppercase font-medium">
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, INVIGOV EXPRESSLY DISCLAIMS ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, ACCURACY, AND UNINTERRUPTED OR ERROR-FREE OPERATION.
            </p>
            <p className="mt-2 uppercase font-medium">
              INVIGOV DOES NOT WARRANT THAT (A) THE SERVICE WILL MEET YOUR SPECIFIC REQUIREMENTS; (B) THE SERVICE WILL BE UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE; (C) ANY DOCUMENTS GENERATED BY THE SERVICE WILL BE ACCEPTED BY SAM.GOV OR ANY GOVERNMENT AGENCY; OR (D) ANY ERRORS IN THE SERVICE WILL BE CORRECTED.
            </p>
            <p className="mt-2">Nothing in this Section limits the representations INVIGOV makes regarding specific security measures described in the Privacy Policy.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Limitation of Liability</h2>
            <p className="uppercase font-medium">
              TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL INVIGOV, ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, LOSS OF DATA, LOSS OF BUSINESS OPPORTUNITIES, LOSS OF CONTRACT ELIGIBILITY, OR COST OF SUBSTITUTE SERVICES, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF OR INABILITY TO USE THE SERVICE, EVEN IF INVIGOV HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>
            <p className="mt-2 uppercase font-medium">
              IN ALL CASES, INVIGOV&apos;S AGGREGATE LIABILITY TO YOU FOR ANY CLAIM ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE TOTAL FEES PAID BY YOU TO INVIGOV IN THE TWELVE (12) MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO THE CLAIM, OR ONE HUNDRED DOLLARS ($100.00), WHICHEVER IS GREATER.
            </p>
            <p className="mt-2">Some jurisdictions do not allow the exclusion or limitation of certain damages. In such jurisdictions, INVIGOV&apos;s liability is limited to the maximum extent permitted by applicable law.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Indemnification</h2>
            <p>You agree to defend, indemnify, and hold harmless INVIGOV, its officers, directors, employees, agents, licensors, and affiliates from and against any and all claims, damages, obligations, losses, liabilities, costs, and expenses (including reasonable attorneys&apos; fees) arising from or related to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Your use of or access to the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any applicable federal, state, or local law or regulation, including any federal procurement or certification statute</li>
              <li>Any information or data you submit through the Service that is false, inaccurate, or misleading</li>
              <li>Any third-party claim arising from your use of the Service</li>
            </ul>
            <p className="mt-2">INVIGOV reserves the right to assume exclusive control of any matter subject to indemnification by you, in which case you agree to cooperate fully with INVIGOV in asserting any available defenses.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">11. Intellectual Property</h2>
            <p>
              All content, features, functionality, design elements, software, algorithms, and proprietary methodologies comprising the Service are and shall remain the exclusive property of INVIGOV and its licensors, protected by copyright, trademark, trade secret, and other intellectual property laws. These Terms do not convey to you any ownership interest in or to the Service.
            </p>
            <p className="mt-2">
              Documents generated by the Service using data you submitted are owned by you. INVIGOV retains a limited, non-exclusive, royalty-free license to use anonymized, aggregated data derived from platform usage for the purposes of improving the Service, provided that such use does not identify you or your business.
            </p>
            <p className="mt-2">You may not reproduce, distribute, modify, create derivative works of, publicly display, or exploit any portion of the Service without our prior written consent.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">12. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account and access to the Service at any time, with or without cause, and with or without notice, including but not limited to for violation of these Terms, submission of fraudulent information, or suspected procurement fraud. Termination for cause, including false federal certifications or illegal activity, is effective immediately without notice.
            </p>
            <p className="mt-2">
              For terminations not related to cause, we will provide seven (7) days&apos; prior notice during which you may export your data. Following termination, INVIGOV will retain your data for thirty (30) days before permanent deletion, during which you may request a data export by contacting <a href="mailto:support@invigov.com" className="text-blue-600 hover:underline">support@invigov.com</a>.
            </p>
            <p className="mt-2">Upon termination, your right to use the Service immediately ceases. All provisions of these Terms that by their nature should survive termination shall survive, including Sections 6, 8, 9, 10, 11, 13, and 14.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">13. Dispute Resolution and Arbitration</h2>

            <h3 className="text-base font-medium text-gray-800 mb-2">13.1 Informal Resolution</h3>
            <p>
              Before initiating arbitration, you agree to contact INVIGOV at <a href="mailto:support@invigov.com" className="text-blue-600 hover:underline">support@invigov.com</a> and describe the nature of your dispute. The parties will attempt in good faith to resolve the dispute informally within thirty (30) days of notice.
            </p>

            <h3 className="text-base font-medium text-gray-800 mt-4 mb-2">13.2 Binding Arbitration</h3>
            <p>
              If the dispute is not resolved informally, you and INVIGOV agree that any dispute, claim, or controversy arising out of or relating to these Terms or the Service shall be resolved by binding arbitration administered by the American Arbitration Association (AAA) under its Consumer Arbitration Rules, except as otherwise provided herein. The arbitration shall be conducted in Delaware or, at your election, by video conference. The arbitrator&apos;s decision shall be final and binding and may be entered as a judgment in any court of competent jurisdiction.
            </p>

            <h3 className="text-base font-medium text-gray-800 mt-4 mb-2">13.3 Class Action Waiver</h3>
            <p className="uppercase font-medium">
              YOU AND INVIGOV AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS ACTION, CLASS ARBITRATION, OR REPRESENTATIVE PROCEEDING. THE ARBITRATOR MAY NOT CONSOLIDATE MORE THAN ONE PERSON&apos;S CLAIMS AND MAY NOT OTHERWISE PRESIDE OVER ANY FORM OF REPRESENTATIVE OR CLASS PROCEEDING.
            </p>

            <h3 className="text-base font-medium text-gray-800 mt-4 mb-2">13.4 Exceptions</h3>
            <p>Nothing in this Section prevents either party from seeking injunctive or other equitable relief from a court of competent jurisdiction where necessary to protect intellectual property rights or prevent irreparable harm pending arbitration.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">14. Governing Law and Venue</h2>
            <p>
              These Terms and any disputes arising hereunder shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of law principles. For any matter not subject to arbitration under Section 13, the parties consent to the exclusive jurisdiction of the state and federal courts located in the State of Delaware.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">15. Force Majeure</h2>
            <p>
              INVIGOV shall not be liable for any failure or delay in performance resulting from causes beyond our reasonable control, including but not limited to acts of God, government actions, changes to federal procurement systems (including SAM.gov), internet service disruptions, cloud infrastructure outages, cyberattacks, or any other event constituting force majeure. In such events, INVIGOV will use commercially reasonable efforts to restore the Service as soon as practicable.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">16. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. For material changes, we will provide at least thirty (30) days&apos; prior notice by email to registered users or by prominent notice within the Service. Your continued use of the Service after the effective date of any modification constitutes your acceptance of the updated Terms. If you do not agree to the modified Terms, you must discontinue use of the Service before the effective date.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">17. Miscellaneous</h2>

            <h3 className="text-base font-medium text-gray-800 mb-2">17.1 Entire Agreement</h3>
            <p>These Terms, together with the Privacy Policy, constitute the entire agreement between you and INVIGOV with respect to the Service and supersede all prior or contemporaneous communications, agreements, or representations.</p>

            <h3 className="text-base font-medium text-gray-800 mt-4 mb-2">17.2 Severability</h3>
            <p>If any provision of these Terms is found by a court or arbitrator to be invalid or unenforceable, that provision shall be enforced to the maximum extent permitted and the remaining provisions shall continue in full force and effect.</p>

            <h3 className="text-base font-medium text-gray-800 mt-4 mb-2">17.3 Waiver</h3>
            <p>INVIGOV&apos;s failure to enforce any right or provision of these Terms shall not constitute a waiver of such right or provision unless acknowledged in writing by an authorized officer of INVIGOV.</p>

            <h3 className="text-base font-medium text-gray-800 mt-4 mb-2">17.4 Assignment</h3>
            <p>You may not assign or transfer these Terms or any rights hereunder without INVIGOV&apos;s prior written consent. INVIGOV may assign these Terms in connection with a merger, acquisition, or sale of all or substantially all of its assets without your consent.</p>

            <h3 className="text-base font-medium text-gray-800 mt-4 mb-2">17.5 No Legal Advice</h3>
            <p>INVIGOV is a technology platform and does not provide legal, regulatory, or financial advice. Nothing in the Service or these Terms constitutes legal advice. You should consult qualified legal and regulatory counsel for guidance on federal procurement compliance requirements applicable to your specific situation.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">18. Contact</h2>
            <p>For questions regarding these Terms, contact us at:</p>
            <ul className="list-none mt-2 space-y-1">
              <li>Email: <a href="mailto:support@invigov.com" className="text-blue-600 hover:underline">support@invigov.com</a></li>
              <li>Platform: <a href="/contact" className="text-blue-600 hover:underline">invigov.com/contact</a></li>
            </ul>
          </section>

          <p className="text-xs text-gray-400 mt-8 pt-4 border-t">
            INVIGOV &mdash; invigov.com &mdash; This document does not constitute legal advice.
          </p>
        </div>
      </main>
    </div>
  );
}
