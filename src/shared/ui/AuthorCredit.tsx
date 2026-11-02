import { Anchor, Text } from '@mantine/core';
import { useTranslation } from '@/i18n';

export const AUTHOR = { name: 'Adam Lasak', url: 'https://lasak.netlify.app/' } as const;

/** "Developed by Adam Lasak" with a link to the author's site. */
export const AuthorCredit = () => {
  const { t } = useTranslation();
  return (
    <Text size="xs" c="dimmed" ta="center">
      {t('app.developedBy')}{' '}
      <Anchor href={AUTHOR.url} target="_blank" rel="noopener" size="xs" fw={600}>
        {AUTHOR.name}
      </Anchor>
    </Text>
  );
};
