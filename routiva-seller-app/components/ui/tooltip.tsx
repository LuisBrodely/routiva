import { cn } from '@/lib/utils';
import * as TooltipPrimitive from '@rn-primitives/tooltip';
import * as React from 'react';

function Tooltip(props: TooltipPrimitive.RootProps) {
  return <TooltipPrimitive.Root delayDuration={100} {...props} />;
}

function TooltipTrigger(props: TooltipPrimitive.TriggerProps) {
  return <TooltipPrimitive.Trigger {...props} />;
}

function TooltipContent({ className, sideOffset = 8, ...props }: TooltipPrimitive.ContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn('rounded-md border border-border bg-popover px-3 py-2 shadow-sm shadow-black/10', className)}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipContent, TooltipTrigger };
