import { em, getBreakpointValue, useMantineTheme } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';

/** `true` below the `sm` breakpoint – drives sheet vs. popover/modal decisions. */
export const useIsMobile = (): boolean => {
  const theme = useMantineTheme();
  const breakpoint = getBreakpointValue(theme.breakpoints.sm, theme.breakpoints);
  return useMediaQuery(`(max-width: ${em(breakpoint - 0.1)})`, true, { getInitialValueInEffect: false }) ?? true;
};
