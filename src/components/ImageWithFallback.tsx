import { useCallback, useEffect, useRef, useState } from 'react';
import { Package, RefreshCw } from 'lucide-react';
import { resolveAssetUrl } from '../assets/mediaAssets';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
  lazy?: boolean;
  priority?: boolean;
  maxRetries?: number;
  allowManualRetry?: boolean;
}

function buildRetryUrl(baseUrl: string, attempt: number): string {
  if (attempt <= 0 || !baseUrl) return baseUrl;
  if (baseUrl.startsWith('data:') || baseUrl.startsWith('blob:')) return baseUrl;
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}retry=${attempt}`;
}

export function ImageWithFallback({
  src,
  alt,
  className = '',
  fallbackTitle,
  lazy = false,
  priority = false,
  maxRetries = 3,
  allowManualRetry = false,
}: ImageWithFallbackProps) {
  const resolvedSrc = resolveAssetUrl(src);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const retryTimerRef = useRef<number | null>(null);

  const shouldDefer = lazy && !priority;
  const [inView, setInView] = useState<boolean>(!shouldDefer);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [hasError, setHasError] = useState<boolean>(false);

  const clearRetryTimer = useCallback(() => {
    if (retryTimerRef.current !== null) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  // Reset state whenever the source changes
  useEffect(() => {
    clearRetryTimer();
    setHasError(false);
    setIsLoaded(false);
    setRetryCount(0);
    setInView(!shouldDefer);
  }, [resolvedSrc, shouldDefer, clearRetryTimer]);

  // Lazy load via IntersectionObserver with generous pre-fetch margin
  useEffect(() => {
    if (!shouldDefer || inView) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const target = containerRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting || entry.intersectionRatio > 0) {
            setInView(true);
            observer.disconnect();
            break;
          }
        }
      },
      { rootMargin: '220px 0px', threshold: 0.01 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [shouldDefer, inView]);

  // Automatically recover failed images once connectivity returns
  useEffect(() => {
    if (!hasError && retryCount === 0) return;

    const handleOnline = () => {
      clearRetryTimer();
      setHasError(false);
      setIsLoaded(false);
      setRetryCount((prev) => prev + 1);
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [hasError, retryCount, clearRetryTimer]);

  useEffect(() => clearRetryTimer, [clearRetryTimer]);

  const handleImageError = () => {
    clearRetryTimer();
    setIsLoaded(false);

    if (retryCount < maxRetries) {
      const nextAttempt = retryCount + 1;
      const delayMs = Math.min(6000, 900 * Math.pow(2, retryCount));
      retryTimerRef.current = window.setTimeout(() => {
        setRetryCount(nextAttempt);
      }, delayMs);
      return;
    }

    setHasError(true);
  };

  const handleManualRetry = () => {
    clearRetryTimer();
    setHasError(false);
    setIsLoaded(false);
    setInView(true);
    setRetryCount((prev) => prev + 1);
  };

  if (hasError || !resolvedSrc) {
    return (
      <div
        ref={containerRef}
        className={`flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#191D1C] via-[#142521] to-[#202624] text-[#A0ABA6] border border-[#24302C] ${className}`}
        role="img"
        aria-label={alt}
      >
        <Package className="w-7 h-7 text-[#7EF8E6]/70" />
        {fallbackTitle && (
          <span className="text-xs font-medium text-[#A0ABA6] px-3 text-center truncate max-w-full">
            {fallbackTitle}
          </span>
        )}
        {allowManualRetry && resolvedSrc && (
          <button
            type="button"
            onClick={handleManualRetry}
            className="mt-0.5 px-3 py-1.5 rounded-full bg-[#202624] border border-[#354A44] hover:border-[#7EF8E6] text-[11px] font-semibold text-[#7EF8E6] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reintentar foto</span>
          </button>
        )}
      </div>
    );
  }

  const activeSrc = buildRetryUrl(resolvedSrc, retryCount);
  const isExternal = /^https?:\/\//i.test(activeSrc);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-[#111413]">
      {!isLoaded && (
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#191D1C] via-[#142521] to-[#202624] animate-pulse"
          aria-hidden="true"
        />
      )}

      {inView && (
        <img
          src={activeSrc}
          alt={alt}
          loading={shouldDefer ? 'lazy' : 'eager'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          referrerPolicy={isExternal ? 'no-referrer' : undefined}
          onLoad={() => {
            clearRetryTimer();
            setHasError(false);
            setIsLoaded(true);
          }}
          onError={handleImageError}
          className={`${className} transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
}
