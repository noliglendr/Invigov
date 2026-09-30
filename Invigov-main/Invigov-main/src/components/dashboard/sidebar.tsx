"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  comingSoon?: boolean;
  subItems?: { label: string; href: string }[];
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: "SAM Registration",
    href: "/dashboard/workflow",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    subItems: [
      { label: "Registration Workflow", href: "/dashboard/workflow" },
      { label: "Compliance Tracking", href: "/dashboard/compliance" },
    ],
  },
  {
    label: "Billing & Access",
    href: "/dashboard/billing",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = () => {
    localStorage.removeItem("access_token");
    document.cookie = "access_token=; path=/; max-age=0";
    router.push("/login");
  };

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-gray-100 shrink-0">
        <Image
          src="/logo.png"
          alt="INVIGOV Platform"
          width={32}
          height={32}
          unoptimized
          className="shrink-0"
        />
        <div className="leading-tight">
          <p className="text-sm font-semibold text-gray-900">INVIGOV</p>
          <p className="text-xs text-gray-400">Federal Contracting</p>
        </div>
        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="ml-auto md:hidden p-1 rounded-md hover:bg-gray-100"
        >
          <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isParentActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          const hasActiveSubItem = item.subItems?.some(
            (subItem) => pathname === subItem.href
          );

          const isActive = isParentActive || hasActiveSubItem;

          return (
            <div key={item.href}>
              <Link
                href={item.comingSoon ? "#" : item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  item.comingSoon && "cursor-not-allowed opacity-60",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
                onClick={(e) => {
                  if (item.comingSoon) e.preventDefault();
                  else setMobileOpen(false);
                }}
              >
                <span className={cn(isActive ? "text-blue-600" : "text-gray-400")}>
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
                {item.comingSoon && (
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    Soon
                  </span>
                )}
              </Link>

              {/* Sub-items */}
              {item.subItems && isActive && (
                <div className="ml-7 mt-1 space-y-0.5">
                  {item.subItems.map((subItem) => {
                    const isSubActive = pathname === subItem.href;
                    return (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        className={cn(
                          "block px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                          isSubActive
                            ? "text-blue-700 bg-blue-50"
                            : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                        )}
                        onClick={() => setMobileOpen(false)}
                      >
                        {subItem.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-100 shrink-0 space-y-2">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
        >
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </button>
        <div className="flex items-center gap-3 px-3 text-xs text-gray-400">
          <Link href="/privacy" className="hover:text-gray-600 transition-colors">Privacy</Link>
          <span>&middot;</span>
          <Link href="/terms" className="hover:text-gray-600 transition-colors">Terms</Link>
          <span>&middot;</span>
          <Link href="/contact" className="hover:text-gray-600 transition-colors">Contact</Link>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center h-14 px-4 bg-white border-b border-gray-200">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-md hover:bg-gray-100"
        >
          <svg className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex items-center gap-2 ml-3">
          <Image src="/logo.png" alt="INVIGOV" width={32} height={32} unoptimized />
          <span className="text-sm font-semibold text-gray-900">INVIGOV</span>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — desktop: fixed, mobile: slide-in drawer */}
      <aside
        className={cn(
          "fixed top-0 left-0 flex flex-col w-60 h-screen bg-white border-r border-gray-200 z-50 transition-transform duration-200",
          "md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
