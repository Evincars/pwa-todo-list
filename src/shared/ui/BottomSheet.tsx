import { Drawer, FocusTrap, type DrawerProps } from '@mantine/core';
import classes from './BottomSheet.module.css';

export type BottomSheetProps = Omit<DrawerProps, 'position' | 'size'>;

/** Mobile-style bottom sheet: grab handle, content-fitting height, safe-area padding. */
export const BottomSheet = ({ classNames, children, ...props }: BottomSheetProps) => (
  <Drawer
    position="bottom"
    classNames={{ content: classes.content, header: classes.header, body: classes.body, ...classNames }}
    {...props}
  >
    {/* Keeps focus inside the sheet without highlighting the first control on open (touch UX). */}
    <FocusTrap.InitialFocus />
    {children}
  </Drawer>
);
