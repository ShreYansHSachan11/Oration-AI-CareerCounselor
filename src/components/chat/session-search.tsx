'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, MessageSquare, Calendar, Hash } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/utils/cn';
import { api } from '@/utils/api';
import { formatDistanceToNow } from 'date-fns';

interface SessionSearchProps {
  onSessionSelect: (sessionId: string) => void;
  className?: string;
}

interface SearchResult {
  id: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    messages: number;
  };
  messages?: Array<{
    id: string;
    content: string;
    role: 'USER' | 'ASSISTANT';
    createdAt: Date;
  }>;
}

export function SessionSearch({
  onSessionSelect,
  className,
}: SessionSearchProps) {
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Search sessions
  const {
    data: searchResults,
    isLoading,
    isFetching,
  } = api.chat.searchSessions.useQuery(
    {
      query: debouncedQuery,
      includeMessages: true,
      limit: 20,
    },
    {
      enabled: debouncedQuery.length > 0,
    }
  );

  const results = searchResults?.items || [];

  const handleClear = () => {
    setQuery('');
    setDebouncedQuery('');
    setIsExpanded(false);
  };

  const handleResultClick = (sessionId: string) => {
    onSessionSelect(sessionId);
    setIsExpanded(false);
  };

  // Group results by relevance
  const groupedResults = useMemo(() => {
    if (!results.length) return { titleMatches: [], contentMatches: [] };

    const titleMatches: SearchResult[] = [];
    const contentMatches: SearchResult[] = [];

    results.forEach(result => {
      const titleMatch = result.title
        ?.toLowerCase()
        .includes(debouncedQuery.toLowerCase());
      if (titleMatch) {
        titleMatches.push(result);
      } else {
        contentMatches.push(result);
      }
    });

    return { titleMatches, contentMatches };
  }, [results, debouncedQuery]);

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search conversations and messages..."
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setIsExpanded(true);
          }}
          onFocus={() => setIsExpanded(true)}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
            onClick={handleClear}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Search Results */}
      {isExpanded && debouncedQuery && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search Results
              {(isLoading || isFetching) && <Spinner className="h-3 w-3" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 max-h-80 overflow-y-auto">
            {isLoading || isFetching ? (
              <div className="flex items-center justify-center py-8">
                <Spinner className="h-6 w-6" />
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No conversations found</p>
                <p className="text-xs">Try different keywords</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Title Matches */}
                {groupedResults.titleMatches.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      Title Matches
                    </h4>
                    <div className="space-y-1">
                      {groupedResults.titleMatches.map(result => (
                        <SearchResultItem
                          key={result.id}
                          result={result}
                          query={debouncedQuery}
                          onClick={() => handleResultClick(result.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Content Matches */}
                {groupedResults.contentMatches.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      Message Matches
                    </h4>
                    <div className="space-y-1">
                      {groupedResults.contentMatches.map(result => (
                        <SearchResultItem
                          key={result.id}
                          result={result}
                          query={debouncedQuery}
                          onClick={() => handleResultClick(result.id)}
                          showMessagePreview
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Backdrop */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
}

interface SearchResultItemProps {
  result: SearchResult;
  query: string;
  onClick: () => void;
  showMessagePreview?: boolean;
}

function SearchResultItem({
  result,
  query,
  onClick,
  showMessagePreview = false,
}: SearchResultItemProps) {
  const highlightText = (text: string, query: string) => {
    if (!query) return text;

    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark
          key={index}
          className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const getMatchingMessage = () => {
    if (!result.messages || !showMessagePreview) return null;

    return result.messages.find(msg =>
      msg.content.toLowerCase().includes(query.toLowerCase())
    );
  };

  const matchingMessage = getMatchingMessage();

  return (
    <div
      className="p-2 rounded-md hover:bg-accent cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h5 className="text-sm font-medium truncate">
            {highlightText(result.title || 'Untitled Chat', query)}
          </h5>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <Hash className="h-3 w-3" />
              {result._count.messages} messages
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDistanceToNow(new Date(result.updatedAt), {
                addSuffix: true,
              })}
            </span>
          </div>

          {/* Message Preview */}
          {matchingMessage && (
            <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
              <div className="font-medium text-muted-foreground mb-1">
                {matchingMessage.role === 'USER' ? 'You' : 'AI Counselor'}:
              </div>
              <div className="line-clamp-2">
                {highlightText(
                  matchingMessage.content.length > 100
                    ? matchingMessage.content.substring(0, 100) + '...'
                    : matchingMessage.content,
                  query
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
