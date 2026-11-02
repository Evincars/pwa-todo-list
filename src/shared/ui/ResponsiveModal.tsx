import { Modal, type ModalProps } from '@mantine/core';
import { useIsMobile } from '../hooks/useIsMobile';
import { BottomSheet } from './BottomSheet';

export type ResponsiveModalProps = Pick<ModalProps, 'opened' | 'onClose' | 'title' | 'children' | 'size' | 'withCloseButton'>;

/** Centered modal on desktop, bottom sheet on phones. */
export const ResponsiveModal = ({ size = 'md', ...props }: ResponsiveModalProps) => {
  const isMobile = useIsMobile();
  if (isMobile) return <BottomSheet {...props} />;
  return <Modal centered radius="lg" size={size} {...props} />;
};
