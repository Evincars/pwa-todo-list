import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconCheck } from '@tabler/icons-react';
import { getErrorMessage, t } from '@/i18n';

export const notify = {
  success: (message: string, title?: string) =>
    notifications.show({ message, title, color: 'teal', icon: <IconCheck size={18} />, autoClose: 2500 }),
  error: (error: unknown, title = t('errors.generic')) =>
    notifications.show({
      message: getErrorMessage(error),
      title,
      color: 'red',
      icon: <IconAlertTriangle size={18} />,
      autoClose: 5000,
    }),
};
