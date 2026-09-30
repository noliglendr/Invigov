import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* ─── NAV ─── */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Image
                  src="/logo.png"
                  alt="INVIGOV Platform"
                  width={32}
                  height={32}
                  unoptimized
                  className="shrink-0"
                />
                <span className="text-lg font-bold text-gray-900">INVIGOV</span>
              </Link>
              <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-gray-600">
                <a href="#problem" className="hover:text-blue-600 transition-colors">The Problem</a>
                <a href="#platform" className="hover:text-blue-600 transition-colors">Platform</a>
                <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How It Works</a>
                <a href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</a>
              </nav>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/register" className="hidden sm:block">
                <Button size="sm">Get Started Free</Button>
              </Link>
              <Link href="/register" className="sm:hidden">
                <Button size="sm">Start</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-12 sm:pb-16">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
              Federal Contract Intelligence
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6">
              Stop Losing<br />
              Contracts to<br />
              <span className="text-blue-600">SAM.gov</span><br />
              Bureaucracy
            </h1>
            <p className="text-gray-500 text-sm font-mono mb-4">
              // CRITICAL: Your SAM.gov registration expires. Silently. Without warning.
            </p>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              INVIGOV automates your entire SAM.gov compliance lifecycle — registration,
              document generation, renewal monitoring, and deadline alerts — so your
              business stays eligible to win federal contracts.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Free — No Credit Card
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  See How It Works
                </Button>
              </a>
            </div>
          </div>

          {/* Right — Terminal Preview */}
          <div className="hidden lg:block">
            <div className="bg-gray-900 rounded-xl shadow-2xl overflow-hidden border border-gray-700">
              {/* Terminal bar */}
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-gray-400 text-xs ml-2 font-mono">invigov.monitor — live</span>
              </div>
              {/* Terminal body */}
              <div className="p-5 font-mono text-sm space-y-3">
                <p className="text-gray-400">
                  <span className="text-green-400">$ </span>
                  <span className="text-white">invigov scan --entity &quot;Acme Solutions LLC&quot;</span>
                </p>
                <div className="border-t border-gray-700 my-3" />
                <div className="space-y-2">
                  {[
                    { label: "SAM.gov Status", value: "ACTIVE", color: "text-green-400" },
                    { label: "Renewal Deadline", value: "47 days", color: "text-yellow-400" },
                    { label: "NAICS Coverage", value: "8 codes", color: "text-blue-400" },
                    { label: "Reps & Certs", value: "21 clauses", color: "text-blue-400" },
                    { label: "Exclusion Check", value: "CLEAR", color: "text-green-400" },
                    { label: "Cage Code", value: "VERIFY", color: "text-yellow-400" },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between">
                      <span className="text-gray-400">{row.label}</span>
                      <span className={`font-semibold ${row.color}`}>{row.value}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-700 my-3" />
                <p className="text-green-400">
                  ✓ 3 actions recommended
                  <span className="inline-block w-2 h-4 bg-green-400 ml-1 animate-pulse" />
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── DASHBOARD PREVIEW ─── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">See What You Get</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Your Complete Federal Compliance Dashboard
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              From SAM registration to renewal tracking — everything in one place, secured with AES-256 encryption.
            </p>
          </div>

          {/* Dashboard Mockup */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden max-w-5xl mx-auto">
            {/* Browser Chrome */}
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 border-b border-gray-200">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-white rounded-md border border-gray-200 px-4 py-1 text-xs text-gray-500 w-64 text-center">
                  invigov.com/dashboard
                </div>
              </div>
            </div>

            {/* Mock Layout */}
            <div className="flex min-h-[420px]">
              {/* Mock Sidebar */}
              <div className="hidden sm:flex w-48 bg-gray-50 border-r border-gray-200 flex-col p-4 gap-1">
                <div className="flex items-center gap-2 mb-6">
                  <Image src="/logo.png" alt="INVIGOV" width={24} height={24} unoptimized />
                  <span className="text-sm font-bold text-gray-800">INVIGOV</span>
                </div>
                {["Dashboard", "SAM Registration", "Compliance", "Billing"].map((item, i) => (
                  <div
                    key={item}
                    className={`text-xs px-3 py-2 rounded-md ${
                      i === 0 ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-500"
                    }`}
                  >
                    {item}
                  </div>
                ))}
              </div>

              {/* Mock Content */}
              <div className="flex-1 p-4 sm:p-6 space-y-4">
                {/* Mock Hero Banner */}
                <div className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 p-4 sm:p-5 text-white">
                  <p className="text-[10px] uppercase tracking-wider text-blue-200 mb-1">Federal Contract Intelligence</p>
                  <p className="text-sm sm:text-base font-bold">Your Federal Contracting Dashboard</p>
                  <p className="text-[11px] text-blue-200 mt-1">Manage everything in one place</p>
                </div>

                {/* Mock Status + Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Status Card */}
                  <div className="rounded-lg border border-gray-200 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="h-6 w-6 rounded bg-blue-50 flex items-center justify-center">
                        <svg className="h-3 w-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">Active</span>
                    </div>
                    <p className="text-xs font-semibold text-gray-900">Complete Plan</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Full SAM.gov compliance</p>
                  </div>

                  {/* Workflow Card */}
                  <div className="rounded-lg border border-gray-200 p-3">
                    <div className="h-6 w-6 rounded bg-blue-50 flex items-center justify-center mb-2">
                      <svg className="h-3 w-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    <p className="text-xs font-semibold text-gray-900">SAM Registration</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">7-step guided workflow</p>
                  </div>

                  {/* Compliance Card */}
                  <div className="rounded-lg border border-gray-200 p-3">
                    <div className="h-6 w-6 rounded bg-emerald-50 flex items-center justify-center mb-2">
                      <svg className="h-3 w-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-xs font-semibold text-gray-900">Compliance</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Deadline tracking &amp; alerts</p>
                  </div>
                </div>

                {/* Mock Deadlines */}
                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="text-xs font-semibold text-gray-900 mb-2">Upcoming Deadlines</p>
                  <div className="space-y-2">
                    {[
                      { label: "SAM.gov Annual Renewal", days: "47 days", urgency: "bg-yellow-100 text-yellow-700" },
                      { label: "Reps & Certs Update", days: "47 days", urgency: "bg-yellow-100 text-yellow-700" },
                      { label: "CAGE Code Verification", days: "92 days", urgency: "bg-green-100 text-green-700" },
                    ].map((d) => (
                      <div key={d.label} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                        <span className="text-[11px] text-gray-700">{d.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${d.urgency}`}>{d.days}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── THE PROBLEM ─── */}
      <section id="problem" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">The Problem</p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              SAM.gov is a <span className="italic">minefield</span> that costs small businesses millions in lost contracts
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              The federal government awards over $700 billion in contracts annually. But to compete,
              your SAM.gov registration must be active, accurate, and renewed every 365 days — a
              requirement most small businesses discover they&apos;ve failed only after a bid is rejected.
            </p>
            <p className="text-lg text-gray-600 mt-4">
              There&apos;s no grace period. No automatic renewal. No second chance on the bid you just lost.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
                title: "Annual Expiration With Zero Warning",
                desc: "SAM.gov registrations expire silently every year. When your status lapses, every pending bid is automatically disqualified.",
                bg: "bg-red-50",
                iconColor: "text-red-600",
              },
              {
                icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
                title: "The Registration Is Genuinely Confusing",
                desc: "NAICS codes, CAGE codes, UEI numbers, exclusion checks, representations & certifications — designed by government, not for you.",
                bg: "bg-amber-50",
                iconColor: "text-amber-600",
              },
              {
                icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
                title: "Compliance Documents Are a Nightmare",
                desc: "FAR/DFARS certifications, banking authorization letters, registration checklists. Getting them right takes hours and one mistake can delay your entire registration.",
                bg: "bg-blue-50",
                iconColor: "text-blue-600",
              },
              {
                icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
                title: "Document Chaos at Bid Time",
                desc: "When a solicitation drops, your compliance documents are scattered, outdated, or missing. Every hour spent reconstructing is an hour lost.",
                bg: "bg-violet-50",
                iconColor: "text-violet-600",
              },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className={`h-12 w-12 rounded-lg ${item.bg} flex items-center justify-center mb-4`}>
                  <svg className={`h-6 w-6 ${item.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── THE PLATFORM ─── */}
      <section id="platform" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">The Platform</p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Federal compliance <span className="text-blue-600">automation</span> that works while you don&apos;t
            </h2>
            <p className="text-lg text-gray-600 mb-4">
              INVIGOV automates the hardest parts of federal contracting compliance — SAM.gov registration,
              document generation, renewal monitoring, and deadline alerts — so nothing slips through the cracks.
            </p>
            <span className="inline-block text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              All features below are live and available now
            </span>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                num: "01",
                icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
                title: "Automated SAM.gov Registration",
                desc: "Guided 7-step workflow that translates government language into plain English. Complete your registration correctly the first time.",
                tag: "Core Infrastructure",
                bg: "bg-blue-50",
                iconColor: "text-blue-600",
              },
              {
                num: "02",
                icon: "M13 10V3L4 14h7v7l9-11h-7z",
                title: "Renewal Deadline Intelligence",
                desc: "Real-time monitoring with multi-channel alerts at 90, 60, 30, and 7-day intervals before your registration lapses.",
                tag: "Compliance Monitoring",
                bg: "bg-amber-50",
                iconColor: "text-amber-600",
              },
              {
                num: "03",
                icon: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4",
                title: "Compliance Document Vault",
                desc: "AES-256 encrypted storage for all your federal compliance documents — SAM Checklist, Reps & Certs, Banking Authorization — securely stored and ready to download.",
                tag: "Secure Storage",
                bg: "bg-violet-50",
                iconColor: "text-violet-600",
              },
              {
                num: "04",
                icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
                title: "FAR/DFARS Certifications",
                desc: "Automated responses to 21+ FAR/DFARS clauses tailored to your business type. Drug-Free Workplace, Equal Opportunity, Buy American, and more — all handled.",
                tag: "Compliance",
                bg: "bg-red-50",
                iconColor: "text-red-600",
              },
              {
                num: "05",
                icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
                title: "Compliance Deadline Tracking",
                desc: "Never miss a renewal. Automated email alerts at 30, 14, 7, and 1 day before deadlines. Track SAM renewal, CAGE code verification, and custom deadlines.",
                tag: "Monitoring",
                bg: "bg-emerald-50",
                iconColor: "text-emerald-600",
              },
              {
                num: "06",
                icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
                title: "Full Audit Trail",
                desc: "Every state change — payment, workflow progression, document access — is logged. Complete transparency for compliance and internal review.",
                tag: "Security",
                bg: "bg-indigo-50",
                iconColor: "text-indigo-600",
              },
            ].map((card) => (
              <div key={card.num} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-gray-400">{card.num} —</span>
                  <div className={`h-10 w-10 rounded-lg ${card.bg} flex items-center justify-center`}>
                    <svg className={`h-5 w-5 ${card.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                    </svg>
                  </div>
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{card.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{card.desc}</p>
                <span className="inline-block text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                  {card.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">How It Works</p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
              From registration to contract-ready in three steps
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Register & Connect",
                desc: "Create your INVIGOV account, enter your entity information, and connect your existing SAM.gov registration. Our guided workflow identifies gaps and errors immediately.",
              },
              {
                step: "02",
                title: "Automate Monitoring",
                desc: "INVIGOV continuously monitors your registration status, renewal deadlines, and exclusion flags. You receive alerts before issues arise — not after contracts are lost.",
              },
              {
                step: "03",
                title: "Stay Compliant, Stay Eligible",
                desc: "INVIGOV tracks your renewal deadlines and sends automated alerts before anything lapses. Your documents are generated, encrypted, and ready to download whenever you need them.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl bg-blue-600 text-white text-xl font-bold mb-5">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section className="bg-blue-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 text-center text-white">
            {[
              { num: "$700B+", label: "In federal contracts awarded annually — your market" },
              { num: "365", label: "Days until your SAM.gov registration expires — automatically" },
              { num: "21+", label: "FAR/DFARS clauses automated in your compliance documents" },
              { num: "< 5min", label: "To verify your full compliance status on INVIGOV" },
            ].map((stat) => (
              <div key={stat.num}>
                <p className="text-3xl sm:text-4xl font-bold mb-2">{stat.num}</p>
                <p className="text-blue-100 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">Pricing</p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Start free. Upgrade when you&apos;re ready to bid.
            </h2>
            <p className="text-gray-600">
              No credit card required to start. Annual billing available at checkout — save ~17%.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {/* Free */}
            <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Free</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">$0</span>
                <span className="text-gray-500 ml-1">forever</span>
              </div>
              <Link href="/register">
                <Button variant="outline" className="w-full mb-6">Get Started Free</Button>
              </Link>
            </div>

            {/* Intelligence — Most Popular */}
            <div className="bg-white rounded-xl border-2 border-blue-600 p-8 shadow-lg relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Intelligence</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">$199</span>
                <span className="text-gray-500 ml-1">per month</span>
              </div>
              <Link href="/register">
                <Button className="w-full mb-6">Start 7-Day Free Trial</Button>
              </Link>
            </div>

            {/* Complete */}
            <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Complete</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">$279</span>
                <span className="text-gray-500 ml-1">per month</span>
              </div>
              <Link href="/register">
                <Button variant="outline" className="w-full mb-6">Start 7-Day Free Trial</Button>
              </Link>
            </div>
          </div>

          {/* Feature Comparison Table */}
          <div className="hidden sm:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 sm:px-6 font-semibold text-gray-900 w-2/5 text-xs sm:text-sm">Features</th>
                  <th className="text-center py-3 px-2 sm:px-4 font-semibold text-gray-900 text-xs sm:text-sm">Free</th>
                  <th className="text-center py-3 px-2 sm:px-4 font-semibold text-blue-600 bg-blue-50/50 text-xs sm:text-sm">Intelligence</th>
                  <th className="text-center py-3 px-2 sm:px-4 font-semibold text-gray-900 text-xs sm:text-sm">Complete</th>
                </tr>
              </thead>
              <tbody>
                {/* Account & Access */}
                <tr className="bg-gray-50">
                  <td colSpan={4} className="py-2.5 px-4 sm:px-6 font-semibold text-[10px] sm:text-xs uppercase tracking-wide text-gray-500">Account & Access</td>
                </tr>
                <FeatureRow feature="Account & workspace setup" free="✅" intelligence="✅" complete="✅" />
                <FeatureRow feature="Entitlement status tracking" free="✅" intelligence="✅" complete="✅" />
                <FeatureRow feature="Secure billing & plan management" free="✅" intelligence="✅" complete="✅" />

                {/* Compliance Monitoring */}
                <tr className="bg-gray-50">
                  <td colSpan={4} className="py-2.5 px-4 sm:px-6 font-semibold text-[10px] sm:text-xs uppercase tracking-wide text-gray-500">Compliance Monitoring</td>
                </tr>
                <FeatureRow feature="Compliance deadline dashboard" free="⛔" intelligence="✅" complete="✅" />
                <FeatureRow feature="Multi-channel renewal alerts (30d / 14d / 7d / 1d)" free="⛔" intelligence="✅" complete="✅" />
                <FeatureRow feature="Custom deadline tracking" free="⛔" intelligence="✅" complete="✅" />
                <FeatureRow feature="Email notifications" free="⛔" intelligence="✅" complete="✅" />

                {/* SAM.gov Compliance Automation — Complete Only */}
                <tr className="bg-gray-50">
                  <td colSpan={4} className="py-2.5 px-4 sm:px-6 font-semibold text-[10px] sm:text-xs uppercase tracking-wide text-gray-500">SAM.gov Compliance Automation — Complete Only</td>
                </tr>
                <FeatureRow feature="Guided SAM.gov registration workflow (7-step)" free="⛔" intelligence="⛔" complete="✅" />
                <FeatureRow feature="FAR/DFARS representations & certifications (21+ clauses)" free="⛔" intelligence="⛔" complete="✅" />
                <FeatureRow feature="Auto-generated compliance documents (3 PDFs)" free="⛔" intelligence="⛔" complete="✅" />
                <FeatureRow feature="AES-256 encrypted data storage" free="⛔" intelligence="⛔" complete="✅" />
                <FeatureRow feature="Save & resume workflow progress" free="⛔" intelligence="⛔" complete="✅" />
                <FeatureRow feature="Secure document storage (Cloudflare R2)" free="⛔" intelligence="⛔" complete="✅" />
                <FeatureRow feature="Signed URL document downloads" free="⛔" intelligence="⛔" complete="✅" />

                {/* Security & Audit */}
                <tr className="bg-gray-50">
                  <td colSpan={4} className="py-2.5 px-4 sm:px-6 font-semibold text-[10px] sm:text-xs uppercase tracking-wide text-gray-500">Security & Audit</td>
                </tr>
                <FeatureRow feature="JWT-based authentication" free="✅" intelligence="✅" complete="✅" />
                <FeatureRow feature="Full audit trail" free="⛔" intelligence="✅" complete="✅" />
                <FeatureRow feature="Stripe PCI-compliant payments" free="✅" intelligence="✅" complete="✅" />
              </tbody>
            </table>
          </div>

          {/* Mobile Pricing Summary (shown on small screens only) */}
          <div className="sm:hidden space-y-4">
            {[
              { name: "Free", features: ["Account & workspace setup", "Entitlement status tracking", "Billing & plan management"] },
              { name: "Intelligence", features: ["Everything in Free", "Compliance deadline dashboard", "Multi-channel renewal alerts", "Custom deadline tracking", "Email notifications"] },
              { name: "Complete", features: ["Everything in Intelligence", "7-step SAM.gov registration workflow", "Auto-generated compliance documents (3 PDFs)", "AES-256 encrypted data storage", "Save & resume progress", "Unified compliance dashboard"] },
            ].map((plan) => (
              <div key={plan.name} className="bg-white rounded-xl border border-gray-200 p-5">
                <h4 className="font-semibold text-gray-900 mb-3">{plan.name}</h4>
                <ul className="space-y-1.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-green-600 mt-0.5 shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Pricing Footer */}
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500 mb-6">
              All paid plans include a 7-day free trial. No credit card required. Cancel anytime.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button variant="outline">Get Started Free</Button>
              </Link>
              <Link href="/register">
                <Button>Start Free Trial</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── COMING SOON — PHASE 2 ─── */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="inline-block text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full mb-4">
              Coming Soon
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Phase 2: Contract Intelligence
            </h2>
            <p className="text-lg text-gray-600">
              We are building the next layer of INVIGOV to help you find and win federal contracts.
              These features are currently in development and will be available in a future release.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
                title: "AI Contract Search",
                desc: "Search federal contract opportunities using AI-powered matching based on your NAICS codes and business profile.",
              },
              {
                icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
                title: "Eligibility Pre-Filtering",
                desc: "Automatically filter opportunities based on your certifications, set-aside eligibility, and registration status.",
              },
              {
                icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
                title: "Competitive Intelligence",
                desc: "See who is winning contracts in your space, track competitor activity, and identify trends in your target agencies.",
              },
              {
                icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
                title: "Bid Document Generation",
                desc: "Auto-generate bid response documents tailored to specific solicitations using your pre-loaded compliance data.",
              },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 opacity-80">
                <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
                <span className="inline-block text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full mt-3">
                  Future Release
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 sm:p-8 lg:p-12 text-center">
          <p className="text-sm font-semibold text-blue-200 uppercase tracking-wide mb-3">Ready to Compete</p>
          <h2 className="text-3xl font-bold text-white mb-4">
            Your next federal contract starts with <span className="italic">being eligible</span>
          </h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Stop hoping your SAM.gov registration is still active. Stop missing renewals.
            Stop scrambling for compliance documents at bid time. INVIGOV puts your federal compliance on autopilot.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-blue-50">
                Start Free — No Credit Card
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="ghost" className="text-white border-white/30 border hover:bg-white/10">
                Sign Into Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-center sm:justify-between items-center gap-4">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Image
                src="/logo.png"
                alt="INVIGOV"
                width={24}
                height={24}
                unoptimized
              />
              <span className="text-sm font-semibold text-gray-700">INVIGOV</span>
            </Link>
            <p className="text-sm text-gray-500">
              &copy; 2026 INVIGOV — Federal Contract Intelligence Platform. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-gray-500">
              <Link href="/privacy" className="hover:text-gray-700">Privacy</Link>
              <Link href="/terms" className="hover:text-gray-700">Terms</Link>
              <Link href="/contact" className="hover:text-gray-700">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── Pricing Table Row Component ─── */
function FeatureRow({ feature, free, intelligence, complete }: {
  feature: string;
  free: string;
  intelligence: string;
  complete: string;
}) {
  const renderCell = (value: string) => {
    if (value === "✅") return <span className="text-green-600 text-base">✓</span>;
    if (value === "⛔") return <span className="text-red-400 text-base">✕</span>;
    return <span className="text-gray-700 font-medium text-xs">{value}</span>;
  };

  return (
    <tr className="border-t border-gray-100">
      <td className="py-2.5 px-4 sm:px-6 text-gray-700 text-xs sm:text-sm">{feature}</td>
      <td className="py-2.5 px-2 sm:px-4 text-center">{renderCell(free)}</td>
      <td className="py-2.5 px-2 sm:px-4 text-center bg-blue-50/30">{renderCell(intelligence)}</td>
      <td className="py-2.5 px-2 sm:px-4 text-center">{renderCell(complete)}</td>
    </tr>
  );
}
