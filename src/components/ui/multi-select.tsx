'use client';

import React, { useState, useCallback } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  maxDisplay?: number;
  className?: string;
  disabled?: boolean;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Select items...',
  maxDisplay = 3,
  className,
  disabled = false,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = useCallback(
    (optionValue: string) => {
      const newValue = value.includes(optionValue)
        ? value.filter(v => v !== optionValue)
        : [...value, optionValue];
      onChange(newValue);
    },
    [value, onChange]
  );

  const handleSelectAll = useCallback(() => {
    const allValues = options
      .filter(option => !option.disabled)
      .map(option => option.value);
    onChange(value.length === allValues.length ? [] : allValues);
  }, [options, value, onChange]);

  const handleClear = useCallback(() => {
    onChange([]);
  }, [onChange]);

  const selectedOptions = options.filter(option =>
    value.includes(option.value)
  );

  const displayText = () => {
    if (selectedOptions.length === 0) {
      return placeholder;
    }

    if (selectedOptions.length <= maxDisplay) {
      return selectedOptions.map(option => option.label).join(', ');
    }

    return `${selectedOptions.slice(0, maxDisplay).map(option => option.label).join(', ')} +${selectedOptions.length - maxDisplay} more`;
  };

  const allSelectableSelected = options
    .filter(option => !option.disabled)
    .every(option => value.includes(option.value));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between text-left font-normal',
            !value.length && 'text-muted-foreground',
            className
          )}
          disabled={disabled}
        >
          <span className="truncate">{displayText()}</span>
          <div className="flex items-center gap-2">
            {value.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {value.length}
              </Badge>
            )}
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <div className="p-2 border-b">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              className="h-8 px-2"
            >
              <Checkbox
                checked={allSelectableSelected}
                className="mr-2"
                readOnly
              />
              Select All
            </Button>
            {value.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-8 px-2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
        <div className="max-h-60 overflow-auto">
          {options.map(option => (
            <div
              key={option.value}
              className={cn(
                'flex items-center space-x-2 px-3 py-2 cursor-pointer hover:bg-accent',
                option.disabled && 'opacity-50 cursor-not-allowed'
              )}
              onClick={() => !option.disabled && handleSelect(option.value)}
            >
              <Checkbox
                checked={value.includes(option.value)}
                disabled={option.disabled}
                readOnly
              />
              <span className="flex-1 text-sm">{option.label}</span>
              {value.includes(option.value) && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </div>
          ))}
        </div>
        {selectedOptions.length > 0 && (
          <div className="p-2 border-t">
            <div className="flex flex-wrap gap-1">
              {selectedOptions.slice(0, 10).map(option => (
                <Badge
                  key={option.value}
                  variant="secondary"
                  className="text-xs"
                >
                  {option.label}
                  <button
                    className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                    onClick={e => {
                      e.stopPropagation();
                      handleSelect(option.value);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {selectedOptions.length > 10 && (
                <Badge variant="secondary" className="text-xs">
                  +{selectedOptions.length - 10} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}