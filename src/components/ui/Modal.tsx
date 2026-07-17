'use client';

import { Fragment, ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

function Modal({
  open,
  onOpenChange,
  onClose,
  title,
  description,
  children,
  size = 'md',
}: ModalProps) {
  const handleOpenChange = (o: boolean) => {
    if (onOpenChange) {
      onOpenChange(o);
    } else if (!o && onClose) {
      onClose();
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 bg-black/50 animate-fadeIn" />
        <DialogPrimitive.Content
          className={cn(
            'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
            'bg-white rounded-lg shadow-xl p-8',
            'focus:outline-none animate-slideDown',
            'max-h-[90vh] overflow-y-auto',
            {
              'w-full mx-4 max-w-sm': size === 'sm',
              'w-full mx-4 max-w-md': size === 'md',
              'w-full mx-4 max-w-lg': size === 'lg',
            }
          )}
        >
          {title && (
            <DialogPrimitive.Title className="text-2xl font-semibold text-neutral-900 mb-2">
              {title}
            </DialogPrimitive.Title>
          )}
          {description && (
            <DialogPrimitive.Description className="text-base text-neutral-600 mb-6">
              {description}
            </DialogPrimitive.Description>
          )}
          {children}
          <DialogPrimitive.Close
            className="absolute top-6 right-6 text-neutral-400 hover:text-neutral-600 transition-colors"
            aria-label="Close"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 15 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
                fill="currentColor"
                fillRule="evenodd"
                clipRule="evenodd"
              />
            </svg>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export { Modal };
export type { ModalProps };
