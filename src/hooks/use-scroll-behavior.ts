'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseScrollBehaviorOptions {
  threshold?: number;
  autoScrollThreshold?: number;
  smoothScrollDuration?: number;
}

export function useScrollBehavior({
  threshold = 100,
  autoScrollThreshold = 50,
  smoothScrollDuration = 300,
}: UseScrollBehaviorOptions = {}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const shouldAutoScroll = useRef(true);
  const isScrolling = useRef(false);

  const checkScrollPosition = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;

    const { scrollTop, scrollHeight, clientHeight } = element;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const distanceFromTop = scrollTop;

    const nearBottom = distanceFromBottom <= autoScrollThreshold;
    const nearTop = distanceFromTop <= threshold;

    setIsNearBottom(nearBottom);
    setShowScrollToTop(distanceFromTop > threshold);
    setShowScrollToBottom(!nearBottom && distanceFromBottom > threshold);
    
    shouldAutoScroll.current = nearBottom;
  }, [threshold, autoScrollThreshold]);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (isScrolling.current) return;
      checkScrollPosition();
    },
    [checkScrollPosition]
  );

  const scrollToBottom = useCallback(
    (smooth = true) => {
      const element = scrollRef.current;
      if (!element) return;

      isScrolling.current = true;
      
      if (smooth) {
        element.scrollTo({
          top: element.scrollHeight,
          behavior: 'smooth',
        });
        
        // Reset scrolling flag after animation
        setTimeout(() => {
          isScrolling.current = false;
          checkScrollPosition();
        }, smoothScrollDuration);
      } else {
        element.scrollTop = element.scrollHeight;
        isScrolling.current = false;
        checkScrollPosition();
      }
    },
    [smoothScrollDuration, checkScrollPosition]
  );

  const scrollToTop = useCallback(
    (smooth = true) => {
      const element = scrollRef.current;
      if (!element) return;

      isScrolling.current = true;
      
      if (smooth) {
        element.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
        
        // Reset scrolling flag after animation
        setTimeout(() => {
          isScrolling.current = false;
          checkScrollPosition();
        }, smoothScrollDuration);
      } else {
        element.scrollTop = 0;
        isScrolling.current = false;
        checkScrollPosition();
      }
    },
    [smoothScrollDuration, checkScrollPosition]
  );

  const autoScrollToBottom = useCallback(
    (force = false) => {
      if (shouldAutoScroll.current || force) {
        scrollToBottom(true);
      }
    },
    [scrollToBottom]
  );

  // Check scroll position on mount and when content changes
  useEffect(() => {
    checkScrollPosition();
  }, [checkScrollPosition]);

  return {
    scrollRef,
    isNearBottom,
    showScrollToTop,
    showScrollToBottom,
    shouldAutoScroll: shouldAutoScroll.current,
    handleScroll,
    scrollToBottom,
    scrollToTop,
    autoScrollToBottom,
    checkScrollPosition,
  };
}