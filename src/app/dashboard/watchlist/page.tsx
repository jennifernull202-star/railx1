/**
 * Dashboard Watchlist - Redirect to Saved page
 */
import { redirect } from 'next/navigation';

export default function WatchlistPage() {
  redirect('/dashboard/saved');
}
