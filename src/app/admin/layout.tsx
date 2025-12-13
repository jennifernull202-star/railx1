/**
 * THE RAIL EXCHANGE™ — Admin Dashboard Layout
 * 
 * Unified layout for admin section matching the main Dashboard structure.
 * Includes mobile-responsive sidebar, collapsible sections, and real-time features.
 * Requires admin role to access.
 */

"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import ClientAuthProvider from "@/components/providers/ClientAuthProvider";
import {
  Home,
  Users,
  Package,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  CreditCard,
  BarChart3,
  Wrench,
  DollarSign,
  Bot,
  FileCheck,
  AlertTriangle,
  Crown,
  Activity,
  TrendingUp,
  Receipt,
  Tag,
} from "lucide-react";

interface NavSection {
  title: string;
  icon: React.ElementType;
  items: NavItem[];
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

// Inner component that uses session
function AdminLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "overview",
    "management",
  ]);
  const [pendingCounts, setPendingCounts] = useState({
    listings: 0,
    contractors: 0,
  });

  // Redirect non-admins
  useEffect(() => {
    if (status === "authenticated" && !session?.user?.isAdmin) {
      router.push("/dashboard");
    } else if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, session, router]);

  // Fetch pending counts for badges
  useEffect(() => {
    const fetchPendingCounts = async () => {
      try {
        const [listingsRes, contractorsRes] = await Promise.all([
          fetch("/api/admin/listings?status=pending&countOnly=true"),
          fetch("/api/admin/contractors?status=pending&countOnly=true"),
        ]);

        if (listingsRes.ok) {
          const data = await listingsRes.json();
          setPendingCounts((prev) => ({ ...prev, listings: data.count || 0 }));
        }
        if (contractorsRes.ok) {
          const data = await contractorsRes.json();
          setPendingCounts((prev) => ({ ...prev, contractors: data.count || 0 }));
        }
      } catch (error) {
        // Silently fail - badges just won't show
      }
    };

    if (session?.user?.isAdmin) {
      fetchPendingCounts();
      const interval = setInterval(fetchPendingCounts, 60000); // Refresh every minute
      return () => clearInterval(interval);
    }
  }, [session]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (!session?.user || !session.user.isAdmin) {
    return null;
  }

  const user = session.user;

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  // Navigation sections for admin
  const navigationSections: NavSection[] = [
    {
      title: "Overview",
      icon: Home,
      items: [
        { label: "Admin Dashboard", href: "/admin", icon: Home },
        { label: "Platform Analytics", href: "/admin/analytics", icon: BarChart3 },
        { label: "Settings", href: "/admin/settings", icon: Settings },
      ],
    },
    {
      title: "Management",
      icon: Shield,
      items: [
        { label: "User Management", href: "/admin/users", icon: Users },
        { label: "Listing Audit", href: "/admin/listings", icon: Package, badge: pendingCounts.listings > 0 ? String(pendingCounts.listings) : undefined },
        { label: "Contractor Verification", href: "/admin/contractors", icon: Wrench, badge: pendingCounts.contractors > 0 ? String(pendingCounts.contractors) : undefined },
        { label: "Verifications", href: "/admin/verifications", icon: FileCheck },
      ],
    },
    {
      title: "Revenue & Billing",
      icon: DollarSign,
      items: [
        { label: "Add-On Analytics", href: "/admin/addons", icon: Tag },
        { label: "Stripe Monitoring", href: "/admin/stripe", icon: CreditCard },
        { label: "Subscription Reports", href: "/admin/subscriptions", icon: Crown },
        { label: "Promo Codes", href: "/admin/promo-codes", icon: Receipt },
      ],
    },
    {
      title: "Platform Health",
      icon: Activity,
      items: [
        { label: "AI Analytics", href: "/admin/ai-analytics", icon: Bot },
        { label: "System Metrics", href: "/admin/metrics", icon: TrendingUp },
        { label: "Error Logs", href: "/admin/errors", icon: AlertTriangle },
      ],
    },
  ];

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const SidebarLink = ({
    href,
    icon: Icon,
    children,
    badge,
  }: {
    href: string;
    icon: React.ElementType;
    children: React.ReactNode;
    badge?: string;
  }) => {
    const isActive = pathname === href;

    return (
      <Link
        href={href}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
          isActive
            ? "bg-purple-100 text-purple-700 font-medium"
            : "text-gray-700 hover:bg-gray-100"
        }`}
        onClick={() => setSidebarOpen(false)}
      >
        <Icon className="h-5 w-5" />
        <span className="flex-1">{children}</span>
        {badge && (
          <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </Link>
    );
  };

  const SidebarSection = ({ section }: { section: NavSection }) => {
    const isExpanded = expandedSections.includes(section.title.toLowerCase());
    const Icon = section.icon;

    return (
      <div className="mb-2">
        <button
          onClick={() => toggleSection(section.title.toLowerCase())}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Icon className="h-4 w-4" />
          <span className="flex-1 text-left">{section.title}</span>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        {isExpanded && (
          <div className="mt-1 ml-2 space-y-1">
            {section.items.map((item) => (
              <SidebarLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                badge={item.badge}
              >
                {item.label}
              </SidebarLink>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header with back button and menu */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-purple-900 text-white px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-purple-800 text-white/80 hover:text-white"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Link href="/admin" className="flex-1 flex items-center gap-2">
          <span className="text-lg font-bold">RailX</span>
          <span className="bg-purple-600 text-white text-xs font-semibold px-2 py-0.5 rounded">
            ADMIN
          </span>
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-purple-800"
        >
          {sidebarOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Spacer for mobile header */}
      <div className="lg:hidden h-14" />

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo with Admin badge */}
          <div className="p-6 border-b bg-purple-900">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="hidden lg:flex items-center justify-center w-8 h-8 rounded-full bg-purple-800 hover:bg-purple-700 text-white/80 hover:text-white transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <Link href="/admin" className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white">RailX</span>
                <span className="bg-purple-600 text-white text-xs font-semibold px-2 py-0.5 rounded">
                  ADMIN
                </span>
              </Link>
            </div>
          </div>

          {/* Admin user info */}
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {user.name || "Admin"}
                </p>
                <div className="flex items-center gap-1 text-xs">
                  <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                    Administrator
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            {navigationSections.map((section) => (
              <SidebarSection key={section.title} section={section} />
            ))}
          </nav>

          {/* Bottom actions */}
          <div className="p-4 border-t space-y-2">
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all"
            >
              <Home className="h-4 w-4" />
              Exit to Dashboard
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:ml-72 min-h-screen">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}

// Exported wrapper that provides auth context
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientAuthProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </ClientAuthProvider>
  );
}
