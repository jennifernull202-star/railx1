/**
 * THE RAIL EXCHANGE™ — Outbound Clicks Analytics Card
 * 
 * Displays outbound click metrics (phone, email, website, LinkedIn)
 * 
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ ANALYTICS EXPANSION (POST-PROFILES)                                     │
 * │                                                                          │
 * │ Shows: Phone, Email, Website, LinkedIn click totals                     │
 * │ Visual breakdown with icons and percentages                             │
 * └─────────────────────────────────────────────────────────────────────────┘
 */

import { Phone, Mail, Globe, Linkedin, MousePointerClick } from 'lucide-react';

interface OutboundClicksData {
  phone: number;
  email: number;
  website: number;
  linkedin: number;
  inquiry: number;
  total: number;
}

interface OutboundClicksCardProps {
  data: OutboundClicksData;
  loading?: boolean;
}

export function OutboundClicksCard({ data, loading }: OutboundClicksCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-10 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const clickTypes = [
    { key: 'website', label: 'Website', icon: Globe, color: 'text-blue-600', bg: 'bg-blue-100' },
    { key: 'phone', label: 'Phone', icon: Phone, color: 'text-green-600', bg: 'bg-green-100' },
    { key: 'email', label: 'Email', icon: Mail, color: 'text-purple-600', bg: 'bg-purple-100' },
    { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-sky-600', bg: 'bg-sky-100' },
  ] as const;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
            <MousePointerClick className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Outbound Clicks</h3>
            <p className="text-sm text-gray-500">External link engagement</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">{data.total}</p>
          <p className="text-xs text-gray-500">Total clicks</p>
        </div>
      </div>

      <div className="space-y-3">
        {clickTypes.map(({ key, label, icon: Icon, color, bg }) => {
          const count = data[key];
          const percentage = data.total > 0 ? Math.round((count / data.total) * 100) : 0;
          
          return (
            <div key={key} className="flex items-center gap-3">
              <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                  <span className="text-sm text-gray-600">{count}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${bg} transition-all duration-300`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
              <span className="text-xs text-gray-500 w-10 text-right">{percentage}%</span>
            </div>
          );
        })}
      </div>

      {/* Inquiry separate callout */}
      {data.inquiry > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Direct Inquiries</span>
            <span className="font-medium text-gray-900">{data.inquiry}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default OutboundClicksCard;
