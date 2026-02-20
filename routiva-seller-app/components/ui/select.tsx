import { cn } from '@/lib/utils';
import { Ionicons } from '@expo/vector-icons';
import * as SelectPrimitive from '@rn-primitives/select';
import * as React from 'react';
import { View } from 'react-native';

function Select(props: SelectPrimitive.RootProps) {
  return <SelectPrimitive.Root {...props} />;
}

const SelectTrigger = React.forwardRef<SelectPrimitive.TriggerRef, SelectPrimitive.TriggerProps>(
  ({ className, children, ...props }, ref) => (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        'h-11 w-full flex-row items-center justify-between rounded-xl border border-input bg-background px-3',
        className
      )}
      {...props}>
      {typeof children === 'function' ? null : children}
      <Ionicons name="chevron-down" size={16} color="#64748b" />
    </SelectPrimitive.Trigger>
  )
);
SelectTrigger.displayName = 'SelectTrigger';

function SelectValue({ className, ...props }: SelectPrimitive.ValueProps) {
  return <SelectPrimitive.Value className={cn('text-sm text-foreground', className)} {...props} />;
}

function SelectContent({ className, children, ...props }: SelectPrimitive.ContentProps) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Overlay className="absolute inset-0 bg-transparent" />
      <SelectPrimitive.Content
        className={cn('rounded-2xl border border-border bg-popover p-1.5 shadow-sm shadow-black/10', className)}
        {...props}>
        <View className="gap-1">{children}</View>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectGroup(props: SelectPrimitive.GroupProps) {
  return <SelectPrimitive.Group {...props} />;
}

function SelectLabel({ className, ...props }: SelectPrimitive.LabelProps) {
  return <SelectPrimitive.Label className={cn('px-2 py-1 text-xs text-muted-foreground', className)} {...props} />;
}

function SelectItem({ className, children: _children, ...props }: SelectPrimitive.ItemProps) {
  return (
    <SelectPrimitive.Item
      className={cn('flex-row items-center justify-between rounded-lg px-2 py-2 active:bg-accent', className)}
      {...props}>
      <SelectPrimitive.ItemText className="text-sm text-foreground" />
      <SelectPrimitive.ItemIndicator>
        <Ionicons name="checkmark" size={16} color="#0f172a" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
};
