import { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-8 sm:px-12 lg:px-16 bg-white">
        <div className="w-full max-w-sm mx-auto">
          {/* Back to home */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          {/* Brand */}
          <div className="mb-10">
            <Link href="/" className="flex items-center gap-3 mb-8 hover:opacity-80 transition-opacity">
              <Image
                src="/logo.png"
                alt="INVIGOV Platform"
                width={48}
                height={48}
                unoptimized
                className="shrink-0"
              />
              <div className="leading-tight">
                <p className="text-base font-bold text-gray-900 tracking-tight">INVIGOV</p>
                <p className="text-xs text-gray-400">Federal Compliance Automation</p>
              </div>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
            {subtitle && (
              <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
            )}
          </div>

          {/* Form Card */}
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm ring-1 ring-gray-900/5 p-8">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="mt-6 text-center text-sm text-gray-500">{footer}</div>
          )}
        </div>
      </div>

      {/* Right panel — hero image */}
      <div className="hidden lg:flex lg:flex-1 flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800 px-12 py-12 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="auth-grid" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#auth-grid)"/>
          </svg>
        </div>

        {/* Glow circles */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400 rounded-full filter blur-3xl opacity-20"/>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-indigo-400 rounded-full filter blur-3xl opacity-20"/>

        {/* Content */}
        <div className="relative z-10 text-center max-w-md">
          <Image
            src="/images/hero-federal.svg"
            alt="Federal compliance platform"
            width={400}
            height={280}
            unoptimized
            className="w-full max-w-md drop-shadow-2xl"
            priority
          />
          <h2 className="mt-8 text-2xl font-bold text-white leading-tight">
            Automate Your Federal<br/>Compliance Journey
          </h2>
          <p className="mt-3 text-blue-200 text-sm leading-relaxed max-w-xs mx-auto">
            From SAM registration to contract award — your complete federal contracting platform.
          </p>

          {/* Feature bullets */}
          <div className="mt-8 space-y-3 text-left">
            {[
              "7-step guided federal registration",
              "AES-256 encrypted data storage",
              "Automated compliance deadline tracking",
              "PDF document generation & download",
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                  <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L4.586 7.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                </div>
                <span className="text-sm text-blue-100">{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
