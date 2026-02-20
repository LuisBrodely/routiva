import { cn } from '@/lib/utils';
import * as React from 'react';
import { View, type ViewProps } from 'react-native';

function Card({ className, ...props }: ViewProps) {
  return <View className={cn('rounded-xl border border-border bg-card p-4', className)} {...props} />;
}

function CardHeader({ className, ...props }: ViewProps) {
  return <View className={cn('gap-1.5', className)} {...props} />;
}

function CardContent({ className, ...props }: ViewProps) {
  return <View className={cn('gap-3', className)} {...props} />;
}

function CardFooter({ className, ...props }: ViewProps) {
  return <View className={cn('mt-2 flex-row gap-2', className)} {...props} />;
}

export { Card, CardContent, CardFooter, CardHeader };
