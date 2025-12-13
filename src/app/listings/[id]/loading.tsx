/**
 * THE RAIL EXCHANGE™ — Listing Detail Loading Skeleton
 * 
 * BATCH 16: Skeleton loader for listing detail page.
 */

export default function ListingDetailLoading() {
  return (
    <>
      {/* Navigation Skeleton */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-surface-border/50">
        <nav className="container-rail">
          <div className="flex items-center justify-between py-4">
            <div className="h-8 w-40 bg-slate-200 rounded animate-pulse" />
            <div className="h-5 w-24 bg-slate-200 rounded animate-pulse" />
          </div>
        </nav>
      </header>

      <main className="flex-1 bg-surface-secondary pb-32">
        {/* Gallery Skeleton */}
        <div className="bg-white border-b border-surface-border">
          <div className="container-rail py-4">
            <div className="aspect-[4/3] md:aspect-[16/9] max-h-[500px] bg-slate-200 rounded-2xl animate-pulse" />
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="container-rail py-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title & Price */}
              <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6">
                <div className="h-4 w-24 bg-slate-200 rounded animate-pulse mb-2" />
                <div className="h-8 w-3/4 bg-slate-200 rounded animate-pulse mb-4" />
                <div className="h-10 w-32 bg-slate-200 rounded animate-pulse mb-4" />
                <div className="flex gap-4">
                  <div className="h-5 w-28 bg-slate-200 rounded animate-pulse" />
                  <div className="h-5 w-28 bg-slate-200 rounded animate-pulse" />
                </div>
              </div>

              {/* Description */}
              <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6">
                <div className="h-6 w-28 bg-slate-200 rounded animate-pulse mb-4" />
                <div className="space-y-2">
                  <div className="h-4 w-full bg-slate-200 rounded animate-pulse" />
                  <div className="h-4 w-full bg-slate-200 rounded animate-pulse" />
                  <div className="h-4 w-3/4 bg-slate-200 rounded animate-pulse" />
                </div>
              </div>

              {/* Specifications */}
              <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6">
                <div className="h-6 w-32 bg-slate-200 rounded animate-pulse mb-4" />
                <div className="grid grid-cols-2 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
                      <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Form Skeleton */}
              <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6">
                <div className="h-6 w-32 bg-slate-200 rounded animate-pulse mb-4" />
                <div className="h-24 bg-slate-200 rounded animate-pulse mb-4" />
                <div className="h-12 bg-slate-200 rounded animate-pulse" />
              </div>

              {/* Seller Info Skeleton */}
              <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-slate-200 rounded-full animate-pulse" />
                  <div>
                    <div className="h-5 w-28 bg-slate-200 rounded animate-pulse mb-1" />
                    <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Sticky CTA Skeleton */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-surface-border p-4 z-40">
        <div className="container-rail">
          <div className="h-12 bg-slate-200 rounded-lg animate-pulse" />
        </div>
      </div>
    </>
  );
}
