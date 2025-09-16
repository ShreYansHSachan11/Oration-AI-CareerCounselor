'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { cn } from '@/utils/cn';

interface VirtualScrollProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
  loadingComponent?: React.ReactNode;
  getItemKey: (item: T, index: number) => string | number;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
}

export const VirtualScroll = React.forwardRef<
  HTMLDivElement,
  VirtualScrollProps<any>
>(function VirtualScroll<T>(
  {
    items,
    itemHeight,
    containerHeight,
    renderItem,
    overscan = 5,
    className,
    onLoadMore,
    hasMore = false,
    isLoading = false,
    loadingComponent,
    getItemKey,
    onScroll: externalOnScroll,
  }: VirtualScrollProps<T> & {
    onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  },
  ref
) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const loadMoreTriggered = useRef(false);

  const totalHeight = items.length * itemHeight;

  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(
      start + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    );

    return {
      start: Math.max(0, start - overscan),
      end: Math.min(items.length - 1, end + overscan),
    };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  const visibleItems = useMemo(() => {
    const result = [];
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      if (items[i]) {
        result.push({
          item: items[i],
          index: i,
          key: getItemKey(items[i], i),
        });
      }
    }
    return result;
  }, [items, visibleRange, getItemKey]);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const scrollTop = e.currentTarget.scrollTop;
      setScrollTop(scrollTop);

      // Call external scroll handler
      externalOnScroll?.(e);

      // Load more when near bottom
      if (onLoadMore && hasMore && !isLoading && !loadMoreTriggered.current) {
        const scrollHeight = e.currentTarget.scrollHeight;
        const clientHeight = e.currentTarget.clientHeight;
        const threshold = scrollHeight - clientHeight - itemHeight * 3; // 3 items from bottom

        if (scrollTop >= threshold) {
          loadMoreTriggered.current = true;
          onLoadMore();
        }
      }
    },
    [onLoadMore, hasMore, isLoading, itemHeight, externalOnScroll]
  );

  // Reset load more trigger when loading completes
  useEffect(() => {
    if (!isLoading) {
      loadMoreTriggered.current = false;
    }
  }, [isLoading]);

  // Auto-scroll to bottom for new items (useful for chat)
  const scrollToBottom = useCallback(() => {
    if (scrollElementRef.current) {
      scrollElementRef.current.scrollTop =
        scrollElementRef.current.scrollHeight;
    }
  }, []);

  // Expose scroll methods
  useEffect(() => {
    const element = scrollElementRef.current;
    if (element) {
      (element as any).scrollToBottom = scrollToBottom;
    }
  }, [scrollToBottom]);

  return (
    <div
      ref={node => {
        scrollElementRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      }}
      className={cn('overflow-auto', className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index, key }) => (
          <div
            key={key}
            style={{
              position: 'absolute',
              top: index * itemHeight,
              left: 0,
              right: 0,
              height: itemHeight,
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}

        {/* Loading indicator at bottom */}
        {isLoading && loadingComponent && (
          <div
            style={{
              position: 'absolute',
              top: items.length * itemHeight,
              left: 0,
              right: 0,
              height: itemHeight,
            }}
          >
            {loadingComponent}
          </div>
        )}
      </div>
    </div>
  );
});

// Hook for dynamic item heights (more complex but flexible)
export function useVirtualScroll<T>({
  items,
  estimateItemHeight,
  containerHeight,
  overscan = 5,
}: {
  items: T[];
  estimateItemHeight: (index: number) => number;
  containerHeight: number;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const [itemHeights, setItemHeights] = useState<Map<number, number>>(
    new Map()
  );
  const itemRefs = useRef<Map<number, HTMLElement>>(new Map());

  const measureItem = useCallback((index: number, element: HTMLElement) => {
    const height = element.getBoundingClientRect().height;
    setItemHeights(prev => {
      const newMap = new Map(prev);
      newMap.set(index, height);
      return newMap;
    });
    itemRefs.current.set(index, element);
  }, []);

  const getItemHeight = useCallback(
    (index: number) => {
      return itemHeights.get(index) ?? estimateItemHeight(index);
    },
    [itemHeights, estimateItemHeight]
  );

  const getItemOffset = useCallback(
    (index: number) => {
      let offset = 0;
      for (let i = 0; i < index; i++) {
        offset += getItemHeight(i);
      }
      return offset;
    },
    [getItemHeight]
  );

  const getTotalHeight = useCallback(() => {
    let height = 0;
    for (let i = 0; i < items.length; i++) {
      height += getItemHeight(i);
    }
    return height;
  }, [items.length, getItemHeight]);

  const getVisibleRange = useCallback(() => {
    let start = 0;
    let end = items.length - 1;
    let currentOffset = 0;

    // Find start index
    for (let i = 0; i < items.length; i++) {
      const itemHeight = getItemHeight(i);
      if (currentOffset + itemHeight > scrollTop) {
        start = Math.max(0, i - overscan);
        break;
      }
      currentOffset += itemHeight;
    }

    // Find end index
    currentOffset = getItemOffset(start);
    for (let i = start; i < items.length; i++) {
      if (currentOffset > scrollTop + containerHeight) {
        end = Math.min(items.length - 1, i + overscan);
        break;
      }
      currentOffset += getItemHeight(i);
    }

    return { start, end };
  }, [
    scrollTop,
    containerHeight,
    overscan,
    items.length,
    getItemHeight,
    getItemOffset,
  ]);

  return {
    scrollTop,
    setScrollTop,
    measureItem,
    getItemHeight,
    getItemOffset,
    getTotalHeight,
    getVisibleRange,
  };
}
