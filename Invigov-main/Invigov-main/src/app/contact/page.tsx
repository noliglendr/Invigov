import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us - INVIGOV",
};

export default function ContactPage() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Contact Us</h1>
        <p className="text-sm text-gray-500 mb-10">
          We&apos;re here to help with your federal compliance needs
        </p>

        <div className="max-w-lg mx-auto">
          <div className="rounded-xl border border-gray-200 p-8 text-center">
            <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center mb-5 mx-auto">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Get in Touch</h2>
            <p className="text-sm text-gray-600 mb-4">
              For all inquiries — account support, billing, compliance questions, partnerships, or bug reports — reach us at:
            </p>
            <a
              href="mailto:support@invigov.com"
              className="inline-block text-lg font-medium text-blue-600 hover:text-blue-500"
            >
              support@invigov.com
            </a>
            <p className="text-xs text-gray-500 mt-4">
              We typically respond within 1-2 business days. For urgent matters, include &quot;URGENT&quot; in your subject line.
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-xl bg-amber-50 border border-amber-200 p-6">
          <h2 className="text-sm font-semibold text-amber-900 mb-2">Compliance Advisory Disclaimer</h2>
          <p className="text-xs text-amber-800 leading-relaxed">
            INVIGOV is a technology platform that automates SAM.gov registration workflows and generates compliance documents based on user-provided data. INVIGOV does not provide legal, regulatory, or financial advice. Communications through this channel do not establish an attorney-client or advisory relationship. For guidance on federal procurement compliance requirements specific to your situation, consult qualified legal counsel.
          </p>
        </div>
      </main>
    </div>
  );
}
