import { cn } from '@/lib/utils';
import * as AlertDialogPrimitive from '@rn-primitives/alert-dialog';
import * as React from 'react';
import { View } from 'react-native';

function AlertDialog(props: AlertDialogPrimitive.RootProps) {
  return <AlertDialogPrimitive.Root {...props} />;
}

function AlertDialogTrigger(props: AlertDialogPrimitive.TriggerProps) {
  return <AlertDialogPrimitive.Trigger {...props} />;
}

function AlertDialogPortal(props: AlertDialogPrimitive.PortalProps) {
  return <AlertDialogPrimitive.Portal {...props} />;
}

function AlertDialogOverlay({ className, ...props }: AlertDialogPrimitive.OverlayProps) {
  return <AlertDialogPrimitive.Overlay className={cn('absolute inset-0 bg-black/40', className)} {...props} />;
}

function AlertDialogContent({ className, ...props }: AlertDialogPrimitive.ContentProps) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <View className="absolute inset-0 items-center justify-center px-4">
        <AlertDialogPrimitive.Content
          className={cn('w-full max-w-md rounded-2xl border border-border bg-background p-5', className)}
          {...props}
        />
      </View>
    </AlertDialogPortal>
  );
}

function AlertDialogHeader({ className, ...props }: React.ComponentProps<typeof View>) {
  return <View className={cn('gap-1.5', className)} {...props} />;
}

function AlertDialogFooter({ className, ...props }: React.ComponentProps<typeof View>) {
  return <View className={cn('mt-4 flex-row justify-end gap-2', className)} {...props} />;
}

function AlertDialogTitle({ className, ...props }: AlertDialogPrimitive.TitleProps) {
  return <AlertDialogPrimitive.Title className={cn('text-lg font-semibold text-foreground', className)} {...props} />;
}

function AlertDialogDescription({ className, ...props }: AlertDialogPrimitive.DescriptionProps) {
  return <AlertDialogPrimitive.Description className={cn('text-sm text-muted-foreground', className)} {...props} />;
}

function AlertDialogAction(props: AlertDialogPrimitive.ActionProps) {
  return <AlertDialogPrimitive.Action {...props} />;
}

function AlertDialogCancel(props: AlertDialogPrimitive.CancelProps) {
  return <AlertDialogPrimitive.Cancel {...props} />;
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
};
