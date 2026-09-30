import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - INVIGOV",
};

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-10">Last Updated: March 25, 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-sm leading-relaxed text-gray-700">
          {/* Summary */}
          <section className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Summary</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>We collect only what is necessary to provide federal compliance automation services, including your name, email, business entity data, and federal registration identifiers.</li>
              <li>We never sell your personal information to third parties.</li>
              <li>We never store your credit card or banking account numbers. Payment is processed exclusively through Stripe (PCI-compliant). Banking data collected for EFT authorization is AES-256-GCM encrypted and used solely for SAM.gov registration purposes.</li>
              <li>You may request deletion of your account and all associated data at any time by contacting <a href="mailto:support@invigov.com" className="text-blue-600 hover:underline">support@invigov.com</a>. Requests are processed within 30 days.</li>
            </ul>
            <p className="mt-3">Questions? Contact us at <a href="mailto:support@invigov.com" className="text-blue-600 hover:underline">support@invigov.com</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Introduction</h2>
            <p>
              INVIGOV, a product of INVIGOV LLC, a Texas limited liability company and wholly-owned subsidiary of Soventi Holdings Inc., a Delaware corporation, (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), operates the invigov.com platform (the &quot;Service&quot;). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service. By accessing or using the Service, you agree to the practices described in this Policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Information We Collect</h2>
            <h3 className="text-base font-medium text-gray-800 mb-2">2.1 Personal Information</h3>
            <p>When you register for an account or use the Service, we may collect:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Name and email address</li>
              <li>Business name and workspace information</li>
              <li>Federal registration identifiers &mdash; EIN, CAGE code, and UEI number</li>
              <li>NAICS codes and business classification data</li>
              <li>FAR/DFARS representations and certifications responses</li>
            </ul>

            <h3 className="text-base font-medium text-gray-800 mt-4 mb-2">2.2 Banking Information for EFT Authorization</h3>
            <p>For users completing a SAM.gov registration workflow, we collect banking information &mdash; including routing number and account number &mdash; solely for the purpose of generating the EFT Authorization Letter required by the U.S. General Services Administration. This information is:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Encrypted at rest using AES-256-GCM encryption</li>
              <li>Used exclusively for SAM.gov registration purposes</li>
              <li>Never used for payment processing, billing, or any secondary purpose</li>
              <li>Never shared with any third party other than as required for SAM.gov submission</li>
            </ul>

            <h3 className="text-base font-medium text-gray-800 mt-4 mb-2">2.3 Automatically Collected Information</h3>
            <p>When you use the Service, certain information is collected automatically:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>IP address and browser type</li>
              <li>Usage data and access timestamps</li>
              <li>Device information</li>
              <li>Session data and page interaction events collected via cookies or similar tracking technologies (see Section 10)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Data Security</h2>
            <p>We implement the following security measures to protect your data:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>AES-256-GCM encryption</strong> for sensitive fields including EIN, routing numbers, and account numbers</li>
              <li><strong>Bcrypt password hashing</strong> for account credentials</li>
              <li><strong>JWT-based authentication</strong> with short-lived access tokens</li>
              <li><strong>Stripe PCI-compliant</strong> payment processing &mdash; we never store your credit card information</li>
              <li><strong>Signed URLs with expiration</strong> for all document downloads</li>
              <li><strong>Cloudflare R2 encrypted document storage</strong> with access-controlled retrieval</li>
            </ul>
            <p className="mt-2">No security system is impenetrable. While we maintain industry-standard protections, we cannot guarantee absolute security of your data.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. How We Use Your Information</h2>
            <p>We use the information we collect for the following purposes:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>To provide and maintain the Service, including the SAM.gov registration workflow</li>
              <li>To generate required compliance documents (PDF format)</li>
              <li>To send compliance deadline notifications and renewal reminders</li>
              <li>To process payments through Stripe</li>
              <li>To maintain audit logs for compliance and security purposes</li>
              <li>To respond to your inquiries and provide customer support</li>
              <li>To monitor and improve platform performance and reliability</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Data Sharing</h2>
            <p>We do not sell your personal information. We do not share your data with advertisers or data brokers. We may share data only with the following service providers, strictly for the purposes described:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Stripe</strong> &mdash; payment processing (PCI-compliant; governed by Stripe&apos;s Privacy Policy)</li>
              <li><strong>Cloudflare</strong> &mdash; document storage via Cloudflare R2 (encrypted at rest)</li>
              <li><strong>Resend</strong> &mdash; transactional email delivery (renewal alerts, account notifications)</li>
              <li><strong>Sentry</strong> &mdash; application error monitoring (configured to minimize personal data capture; error logs are reviewed solely for platform stability purposes)</li>
            </ul>
            <p className="mt-2">
              We may also disclose your information if required by applicable law, legal process, or governmental request, or to protect the rights, property, or safety of INVIGOV, our users, or the public.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Data Retention and Deletion</h2>
            <p>
              We retain your data for as long as your account is active or as needed to provide the Service. Generated compliance documents are stored securely in Cloudflare R2 for the duration of your account.
            </p>
            <p className="mt-2">
              You may request deletion of your account and all associated data by contacting <a href="mailto:support@invigov.com" className="text-blue-600 hover:underline">support@invigov.com</a>. We will process your request within 30 days. Deletion includes removal of your personal information from our active database and queued removal from Cloudflare R2 document storage. Certain audit log data may be retained for a limited period where required by law or legitimate business necessity.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the following rights with respect to your personal information:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Access</strong> &mdash; request a copy of the personal information we hold about you</li>
              <li><strong>Correction</strong> &mdash; request correction of inaccurate or incomplete information</li>
              <li><strong>Deletion</strong> &mdash; request deletion of your personal information (subject to legal retention requirements)</li>
              <li><strong>Portability</strong> &mdash; request your data in a structured, machine-readable format</li>
              <li><strong>Objection</strong> &mdash; object to certain processing activities</li>
              <li><strong>Withdrawal of consent</strong> &mdash; withdraw consent for data processing where consent is the legal basis</li>
            </ul>
            <p className="mt-2">To exercise any of these rights, contact us at <a href="mailto:support@invigov.com" className="text-blue-600 hover:underline">support@invigov.com</a>. We will respond within 30 days.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">8. California and International Users</h2>
            <h3 className="text-base font-medium text-gray-800 mb-2">8.1 California Residents (CCPA)</h3>
            <p>
              If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA), including the right to know what personal information we collect and how it is used, the right to request deletion, and the right to opt out of the sale of personal information. We do not sell personal information. To exercise your CCPA rights, contact us at <a href="mailto:support@invigov.com" className="text-blue-600 hover:underline">support@invigov.com</a>.
            </p>
            <h3 className="text-base font-medium text-gray-800 mt-4 mb-2">8.2 International Users (GDPR)</h3>
            <p>
              INVIGOV is currently operated for users in the United States. If you are accessing the Service from outside the United States &mdash; including from the European Union, Nigeria, or the UAE &mdash; please be aware that your information may be transferred to and processed in the United States, which may have different data protection laws than your jurisdiction. As our service expands internationally, we will update this Policy to address applicable international data protection requirements, including the EU General Data Protection Regulation (GDPR) where relevant.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Children&apos;s Privacy</h2>
            <p>
              The Service is not directed to individuals under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under 13 without parental consent, we will take steps to delete that information promptly. If you believe we may have collected such information, please contact us at <a href="mailto:support@invigov.com" className="text-blue-600 hover:underline">support@invigov.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Cookies and Tracking Technologies</h2>
            <p>We use cookies and similar tracking technologies to maintain session state, authenticate users, and monitor platform performance. The types of cookies we use include:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Essential cookies</strong> &mdash; required for authentication, session management, and platform functionality. These cannot be disabled without affecting your ability to use the Service.</li>
              <li><strong>Analytics cookies</strong> &mdash; used to understand how users interact with the platform for the purpose of improving performance and reliability. No personally identifiable information is shared with analytics providers.</li>
            </ul>
            <p className="mt-2">You may configure your browser to refuse cookies, but this may affect certain platform features.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. When we do, we will update the &quot;Last Updated&quot; date at the top of this page and, for material changes, notify registered users by email. Your continued use of the Service after any changes constitutes your acceptance of the updated Policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">12. Contact Us</h2>
            <p>If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:</p>
            <ul className="list-none mt-2 space-y-1">
              <li>Email: <a href="mailto:support@invigov.com" className="text-blue-600 hover:underline">support@invigov.com</a></li>
              <li>Platform: <a href="/contact" className="text-blue-600 hover:underline">invigov.com/contact</a></li>
            </ul>
          </section>

          <p className="text-xs text-gray-400 mt-8 pt-4 border-t">
            INVIGOV &mdash; invigov.com &mdash; This document is for informational purposes only and does not constitute legal advice.
          </p>
        </div>
      </main>
    </div>
  );
}
