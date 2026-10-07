import { useId } from "react";

type EduSpaceMarkProps = {
  className?: string;
};

export default function EduSpaceMark({ className }: EduSpaceMarkProps) {
  const id = useId().replace(/:/g, "");

  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`${id}-tile`} x1="8" y1="4" x2="57" y2="62" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563EB" />
          <stop offset="1" stopColor="#172554" />
        </linearGradient>
        <linearGradient id={`${id}-left`} x1="13" y1="21" x2="31" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#BFDBFE" />
        </linearGradient>
        <linearGradient id={`${id}-right`} x1="32" y1="25" x2="51" y2="43" gradientUnits="userSpaceOnUse">
          <stop stopColor="#DBEAFE" />
          <stop offset="1" stopColor="#93C5FD" />
        </linearGradient>
        <linearGradient id={`${id}-edge`} x1="20" y1="34" x2="32" y2="54" gradientUnits="userSpaceOnUse">
          <stop stopColor="#60A5FA" />
          <stop offset="1" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id={`${id}-edge-right`} x1="33" y1="35" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3B82F6" />
          <stop offset="1" stopColor="#1E40AF" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="19" fill={`url(#${id}-tile)`} />
      <path d="M12 25.5 30.5 35v16L12 41.5v-16Z" fill={`url(#${id}-edge)`} />
      <path d="m30.5 35 21.5-11v16L30.5 51V35Z" fill={`url(#${id}-edge-right)`} />
      <path d="m12 20 18.5 9.5v16L12 36V20Z" fill={`url(#${id}-left)`} />
      <path d="m30.5 29.5 21.5-11v16l-21.5 11v-16Z" fill={`url(#${id}-right)`} />
      <path d="m12 20 18.5-9 21.5 7.5-21.5 11L12 20Z" fill="#EFF6FF" />
      <path d="m30.5 29.5 21.5-11v16l-21.5 11v-16Z" fill={`url(#${id}-right)`} />
      <path d="M30.5 29.5v21.4" stroke="#1D4ED8" strokeOpacity=".55" strokeWidth="1.5" />
      <path d="m12 20 18.5-9 21.5 7.5-21.5 11L12 20Z" fill="#fff" fillOpacity=".32" />
      <path d="m45 8 .95 2.85L49 12l-3.05 1.15L45 16l-.95-2.85L41 12l3.05-1.15L45 8Z" fill="#FDE68A" />
    </svg>
  );
}
