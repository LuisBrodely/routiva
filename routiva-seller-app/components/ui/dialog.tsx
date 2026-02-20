import { cn } from '@/lib/utils';
import * as DialogPrimitive from '@rn-primitives/dialog';
import * as React from 'react';
import { View } from 'react-native';

function Dialog(props: DialogPrimitive.RootProps) {
  return <DialogPrimitive.Root {...props} />;
}

function DialogTrigger(props: DialogPrimitive.TriggerProps) {
  return <DialogPrimitive.Trigger {...props} />;
}

function DialogClose(props: DialogPrimitive.CloseProps) {
  return <DialogPrimitive.Close {...props} />;
}

function DialogPortal(props: DialogPrimitive.PortalProps) {
  return <DialogPrimitive.Portal {...props} />;
}

function DialogOverlay({ className, ...props }: DialogPrimitive.OverlayProps) {
  return <DialogPrimitive.Overlay className={cn('absolute inset-0 bg-black/40', className)} {...props} />;
}

function DialogContent({ className, ...props }: DialogPrimitive.ContentProps) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <View className="absolute inset-0 items-center justify-center px-4">
        <DialogPrimitive.Content
          className={cn('w-full max-w-md rounded-2xl border border-border bg-background p-5', className)}
          {...props}
        />
      </View>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<typeof View>) {
  return <View className={cn('gap-1.5', className)} {...props} />;
}

function DialogFooter({ className, ...props }: React.ComponentProps<typeof View>) {
  return <View className={cn('mt-4 flex-row justify-end gap-2', className)} {...props} />;
}

function DialogTitle({ className, ...props }: DialogPrimitive.TitleProps) {
  return <DialogPrimitive.Title className={cn('text-lg font-semibold text-foreground', className)} {...props} />;
}

function DialogDescription({ className, ...props }: DialogPrimitive.DescriptionProps) {
  return <DialogPrimitive.Description className={cn('text-sm text-muted-foreground', className)} {...props} />;
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
