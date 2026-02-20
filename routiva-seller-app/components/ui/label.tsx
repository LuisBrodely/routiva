import { cn } from '@/lib/utils';
import * as React from 'react';
import { Text, type TextProps } from 'react-native';

function Label({ className, ...props }: TextProps) {
  return <Text className={cn('text-sm font-medium text-foreground', className)} {...props} />;
}

export { Label };
