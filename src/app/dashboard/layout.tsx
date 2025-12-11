"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import AIChatWidget from "@/components/AIChatWidget";
import AddOnIndicator from "@/components/dashboard/AddOnIndicator";
import { SubscriptionProvider, useSubscription } from "@/components/providers/SubscriptionProvider";
import {
  Home,
  Package,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  Bell,
  CreditCard,
  Heart,
  ShoppingCart,
  Wrench,
  BarChart3,
  FileText,
  Star,
  Shield,
  ChevronDown,
  ChevronRight,
  Crown,
  Lock,
  ArrowLeft,
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface NavSection {
  title: string;
  icon: React.ElementType;
  items: NavItem[];
  requiresSubscription?: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

// Inner component that uses subscription context
function DashboardLayoutInner({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  const { hasSellerSubscription, isVerifiedContractor: isSubVerifiedContractor, subscription } = useSubscription();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "general",
    "marketplace",
  ]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  // Fetch unread notification count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await fetch("/api/notifications?unreadOnly=true");
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.notifications?.length || 0);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    };

    if (session?.user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  // Fetch unread messages count from inquiries
  useEffect(() => {
    const fetchUnreadMessages = async () => {
      try {
        // Fetch both as seller and buyer to get total unread
        const [sellerRes, buyerRes] = await Promise.all([
          fetch("/api/inquiries?role=seller&status=all"),
          fetch("/api/inquiries?role=buyer&status=all"),
        ]);
        
        let totalUnread = 0;
        
        if (sellerRes.ok) {
          const sellerData = await sellerRes.json();
          totalUnread += sellerData.unreadCount || 0;
        }
        
        if (buyerRes.ok) {
          const buyerData = await buyerRes.json();
          totalUnread += buyerData.unreadCount || 0;
        }
        
        setUnreadMessagesCount(totalUnread);
      } catch (error) {
        console.error("Failed to fetch unread messages:", error);
      }
    };

    if (session?.user) {
      fetchUnreadMessages();
      const interval = setInterval(fetchUnreadMessages, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const user = session.user;
  const isAdmin = user.isAdmin === true;
  // Use subscription context for fresh data (hasSellerSubscription comes from context)
  const isVerifiedContractor = isSubVerifiedContractor || user.isVerifiedContractor === true;
  // Get display tier from subscription context (fresh from DB)
  const displayTier = subscription?.sellerTier !== 'buyer' ? subscription?.sellerTier : user.subscriptionTier;
  const subscriptionStatus = subscription?.sellerStatus;

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  // Navigation sections - unified for all users
  const navigationSections: NavSection[] = [
    {
      title: "General",
      icon: Home,
      items: [
        { label: "Dashboard", href: "/dashboard", icon: Home },
        { label: "Messages", href: "/dashboard/messages", icon: MessageSquare, badge: unreadMessagesCount > 0 ? String(unreadMessagesCount) : undefined },
        { label: "Notifications", href: "/dashboard/settings", icon: Bell, badge: unreadCount > 0 ? String(unreadCount) : undefined },
        { label: "Profile", href: "/dashboard/profile", icon: User },
        { label: "Upgrade", href: "/dashboard/upgrade", icon: Crown },
        { label: "Billing", href: "/dashboard/billing", icon: CreditCard },
        { label: "Settings", href: "/dashboard/settings", icon: Settings },
      ],
    },
    {
      title: "Marketplace",
      icon: ShoppingCart,
      items: [
        { label: "Browse Listings", href: "/listings", icon: Package },
        { label: "Saved Items", href: "/dashboard/saved", icon: Heart },
        { label: "My Inquiries", href: "/dashboard/inquiries", icon: MessageSquare },
        { label: "Find Contractors", href: "/contractors", icon: Wrench },
      ],
    },
  ];

  // Add Seller section - ALWAYS show for all users (isSeller is always true)
  navigationSections.push({
    title: "Selling",
    icon: Package,
    requiresSubscription: hasSellerSubscription ? undefined : "seller",
    items: [
      { label: "My Listings", href: "/dashboard/listings", icon: Package },
      { label: "Create Listing", href: "/listings/create", icon: FileText },
      { label: "My Add-Ons", href: "/dashboard/addons", icon: Star },
      { label: "Leads & Inquiries", href: "/dashboard/leads", icon: MessageSquare },
      { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
      { label: "Verified Seller", href: "/dashboard/verification/seller", icon: Shield },
    ],
  });

  // Add Contractor section ONLY if user has opted in (isContractor === true)
  const userIsContractor = user.isContractor === true;
  if (userIsContractor) {
    navigationSections.push({
      title: "Contractor",
      icon: Wrench,
      requiresSubscription: isVerifiedContractor ? undefined : "contractor",
      items: [
        { label: "My Services", href: "/dashboard/contractor", icon: Wrench },
        { label: "Contractor Profile", href: "/dashboard/contractor/setup", icon: User },
        { label: "Service Leads", href: "/dashboard/contractor/leads", icon: MessageSquare },
        ...(isVerifiedContractor
          ? [{ label: "Verified Badge", href: "/dashboard/contractor/verified", icon: Shield }]
          : [{ label: "Get Verified", href: "/dashboard/contractor/verify", icon: Star }]),
      ],
    });
  }

  // Admin section
  if (isAdmin) {
    navigationSections.push({
      title: "Admin",
      icon: Shield,
      items: [
        { label: "Admin Dashboard", href: "/admin", icon: Shield },
        { label: "Manage Users", href: "/admin/users", icon: User },
        { label: "Manage Listings", href: "/admin/listings", icon: Package },
        { label: "Contractors", href: "/admin/contractors", icon: Wrench },
        { label: "Seller Verifications", href: "/admin/verification/sellers", icon: Shield },
        { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
      ],
    });
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const SidebarLink = ({
    href,
    icon: Icon,
    children,
    badge,
    locked,
  }: {
    href: string;
    icon: React.ElementType;
    children: React.ReactNode;
    badge?: string;
    locked?: boolean;
  }) => {
    const isActive = pathname === href;

    if (locked) {
      return (
        <div
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 cursor-not-allowed`}
        >
          <Icon className="h-5 w-5" />
          <span className="flex-1">{children}</span>
          <Lock className="h-4 w-4" />
        </div>
      );
    }

    return (
      <Link
        href={href}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
          isActive
            ? "bg-orange-100 text-orange-700 font-medium"
            : "text-gray-700 hover:bg-gray-100"
        }`}
        onClick={() => setSidebarOpen(false)}
      >
        <Icon className="h-5 w-5" />
        <span className="flex-1">{children}</span>
        {badge && (
          <span className="bg-orange-600 text-white text-xs px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </Link>
    );
  };

  const SidebarSection = ({ section }: { section: NavSection }) => {
    const isExpanded = expandedSections.includes(section.title.toLowerCase());
    const isLocked = !!section.requiresSubscription;
    const Icon = section.icon;

    return (
      <div className="mb-2">
        <button
          onClick={() => toggleSection(section.title.toLowerCase())}
          className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
            isLocked
              ? "text-gray-400 hover:bg-gray-50"
              : "text-gray-900 hover:bg-gray-100"
          }`}
        >
          <Icon className="h-4 w-4" />
          <span className="flex-1 text-left">{section.title}</span>
          {isLocked && (
            <Link
              href={section.requiresSubscription === "seller" ? "/dashboard/upgrade" : "/contractors/onboard"}
              className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full hover:bg-orange-200"
              onClick={(e) => e.stopPropagation()}
            >
              Upgrade
            </Link>
          )}
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
                locked={isLocked}
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
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => window.history.back()}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Link href="/" className="flex-1">
          <span className="text-lg font-bold text-orange-600">RailX</span>
        </Link>
        {hasSellerSubscription && <AddOnIndicator />}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-gray-100"
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
          {/* Logo with back button */}
          <div className="p-6 border-b">
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.history.back()}
                className="hidden lg:flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <Link href="/" className="flex items-center gap-2">
                <span className="text-2xl font-bold text-orange-600">RailX</span>
              </Link>
              {hasSellerSubscription && (
                <div className="ml-auto hidden lg:block">
                  <AddOnIndicator />
                </div>
              )}
            </div>
          </div>

          {/* User info */}
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {user.name || "User"}
                </p>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  {hasSellerSubscription && (
                    <span className="flex items-center gap-1 bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                      <Crown className="h-3 w-3" />
                      {displayTier}
                      {subscriptionStatus === 'trialing' && (
                        <span className="ml-1 text-[10px] bg-blue-100 text-blue-700 px-1 rounded">Trial</span>
                      )}
                    </span>
                  )}
                  {isVerifiedContractor && (
                    <span className="flex items-center gap-1 bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                      <Shield className="h-3 w-3" />
                      Verified
                    </span>
                  )}
                  {isAdmin && (
                    <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                      Admin
                    </span>
                  )}
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
            {!hasSellerSubscription && (
              <Link
                href="/dashboard/upgrade"
                className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all"
              >
                <Crown className="h-4 w-4" />
                Upgrade Plan
              </Link>
            )}
            {!userIsContractor && (
              <Link
                href="/dashboard/contractor/become"
                className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all"
              >
                <Wrench className="h-4 w-4" />
                Become a Contractor
              </Link>
            )}
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

      {/* AI Chat Widget */}
      <AIChatWidget />
    </div>
  );
}

// Exported wrapper that provides subscription context
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SubscriptionProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </SubscriptionProvider>
  );
}
