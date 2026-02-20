import { cn } from '@/lib/utils';
import * as React from 'react';
import { Platform, TextInput, type TextInputProps } from 'react-native';

function Input({ className, ...props }: TextInputProps) {
  return (
    <TextInput
      className={cn(
        'h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground',
        'placeholder:text-muted-foreground',
        Platform.select({
          web: 'outline-none transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
        }),
        className
      )}
      accessibilityRole="none"
      {...props}
    />
  );
}

export { Input };
