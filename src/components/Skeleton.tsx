import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function SkeletonLine({ className = '' }: SkeletonProps): React.ReactElement {
  return <div className={`skeleton h-4 rounded ${className}`} />;
}

export function SkeletonText({ className = '' }: SkeletonProps): React.ReactElement {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <SkeletonLine className="w-full" />
      <SkeletonLine className="w-5/6" />
      <SkeletonLine className="w-4/6" />
    </div>
  );
}

export function SkeletonCard({ className = '' }: SkeletonProps): React.ReactElement {
  return (
    <div
      className={`rounded-2xl overflow-hidden flex-shrink-0 ${className}`}
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Image area — 3:4 ratio */}
      <div
        className="skeleton w-full"
        style={{ aspectRatio: '3/4' }}
      />
      <div className="p-4 flex flex-col gap-3">
        {/* Category pill */}
        <SkeletonLine className="w-20 h-5 rounded-full" />
        {/* Title */}
        <SkeletonLine className="w-full h-6" />
        <SkeletonLine className="w-4/5 h-6" />
        {/* Meta */}
        <SkeletonLine className="w-3/5 h-4" />
        <SkeletonLine className="w-2/5 h-4" />
        {/* Price */}
        <SkeletonLine className="w-1/3 h-5 mt-2" />
      </div>
    </div>
  );
}
