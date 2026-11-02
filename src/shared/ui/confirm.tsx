import { Button, Group, Modal, Text } from '@mantine/core';
import type { ReactNode } from 'react';
import { create } from 'zustand';

export interface ConfirmOptions {
  title: ReactNode;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Styles the confirm button as destructive. */
  danger?: boolean;
}

interface ConfirmState {
  request: (ConfirmOptions & { resolve: (confirmed: boolean) => void }) | null;
}

const useConfirmStore = create<ConfirmState>()(() => ({ request: null }));

/** Promise-based confirmation dialog: `if (await confirm({...})) doIt()`. */
export const confirm = (options: ConfirmOptions): Promise<boolean> =>
  new Promise((resolve) => {
    useConfirmStore.getState().request?.resolve(false);
    useConfirmStore.setState({ request: { ...options, resolve } });
  });

const settle = (confirmed: boolean) => {
  useConfirmStore.getState().request?.resolve(confirmed);
  useConfirmStore.setState({ request: null });
};

/** Mount once near the root. */
export const ConfirmDialogHost = () => {
  const request = useConfirmStore((state) => state.request);
  return (
    <Modal opened={!!request} onClose={() => settle(false)} title={request?.title} centered radius="lg" size="sm">
      {request?.message && (
        <Text size="sm" c="dimmed" mb="lg">
          {request.message}
        </Text>
      )}
      <Group justify="flex-end" gap="sm">
        <Button variant="default" onClick={() => settle(false)}>
          {request?.cancelLabel ?? 'Cancel'}
        </Button>
        <Button color={request?.danger ? 'red' : undefined} onClick={() => settle(true)} data-autofocus>
          {request?.confirmLabel ?? 'Confirm'}
        </Button>
      </Group>
    </Modal>
  );
};
