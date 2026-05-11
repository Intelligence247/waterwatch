import type { ImgHTMLAttributes } from 'react';

type WaterWatchLogoProps = ImgHTMLAttributes<HTMLImageElement>;

/**
 * Official WaterWatch horizontal lockup (`/public/waterwatch-logo.png`).
 */
export function WaterWatchLogo({ className = '', alt = 'WaterWatch', ...rest }: WaterWatchLogoProps) {
  return (
    <img
      src="/waterwatch-logo.png"
      alt={alt}
      className={`object-contain object-left select-none ${className}`}
      decoding="async"
      {...rest}
    />
  );
}
