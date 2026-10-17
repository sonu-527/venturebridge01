import React from 'react';
import { ShieldCheck, ShieldAlert, Clock } from 'lucide-react';

interface TrustBadgeProps {
  status: 'Verified' | 'Verification Pending' | 'Unverified' | string;
  size?: 'sm' | 'md';
}

export const TrustBadge: React.FC<TrustBadgeProps> = ({ status, size = 'sm' }) => {
  const isSm = size === 'sm';

  if (status === 'Verified') {
    return (
      <span
        title="Verified: Entity has verified credentials or business registration."
        className={`inline-flex items-center gap-1 font-medium bg-[#EAF7EF] text-[#08663A] border border-[#138A4B]/20 rounded-full ${
          isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
        }`}
      >
        <ShieldCheck className={isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        <span>Verified</span>
      </span>
    );
  }

  if (status === 'Verification Pending') {
    return (
      <span
        title="Verification Pending: Submitted documents are currently in the review queue."
        className={`inline-flex items-center gap-1 font-medium bg-amber-50 text-amber-800 border border-amber-200 rounded-full ${
          isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
        }`}
      >
        <Clock className={isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        <span>Review Pending</span>
      </span>
    );
  }

  return (
    <span
      title="Unverified: Community submission not yet independently verified. Exercise standard diligence."
      className={`inline-flex items-center gap-1 font-medium bg-gray-100 text-gray-600 border border-gray-200 rounded-full ${
        isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
      }`}
    >
      <ShieldAlert className={isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      <span>Unverified</span>
    </span>
  );
};
