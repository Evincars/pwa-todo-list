import { Popover, Text, type PopoverProps } from '@mantine/core';
import type { ReactElement, ReactNode } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';
import { BottomSheet } from './BottomSheet';

export interface ResponsiveOverlayProps {
  opened: boolean;
  onClose: () => void;
  /** Element the popover anchors to (must accept a ref). */
  target: ReactElement;
  title?: ReactNode;
  children: ReactNode;
  width?: PopoverProps['width'];
  position?: PopoverProps['position'];
}

/**
 * Popover on larger screens, bottom sheet on phones – one API for both.
 * Use for pickers and small contextual forms.
 */
export const ResponsiveOverlay = ({
  opened,
  onClose,
  target,
  title,
  children,
  width = 300,
  position = 'bottom-start',
}: ResponsiveOverlayProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <>
        {target}
        <BottomSheet opened={opened} onClose={onClose} title={title} withCloseButton={false}>
          {children}
        </BottomSheet>
      </>
    );
  }

  return (
    <Popover opened={opened} onChange={(next) => !next && onClose()} width={width} position={position} shadow="lg" trapFocus>
      <Popover.Target>{target}</Popover.Target>
      <Popover.Dropdown p="xs">
        {title && (
          <Text fw={600} size="sm" px="xs" pt={4} pb="xs">
            {title}
          </Text>
        )}
        {children}
      </Popover.Dropdown>
    </Popover>
  );
};
