import { Button, EmptyState } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { getErrorMessage, useTranslation } from '@/i18n';

export interface QueryViewProps<TData> {
  query: Pick<UseQueryResult<TData>, 'data' | 'error' | 'isPending' | 'refetch'>;
  loading: ReactNode;
  children: (data: TData) => ReactNode;
  /** Custom error rendering; defaults to an empty state with retry. */
  renderError?: (error: unknown) => ReactNode;
}

/** Declarative pending / error / success switch for a TanStack query. */
export const QueryView = <TData,>({ query, loading, children, renderError }: QueryViewProps<TData>) => {
  const { t } = useTranslation();
  if (query.isPending) return <>{loading}</>;
  if (query.error) {
    return renderError ? (
      <>{renderError(query.error)}</>
    ) : (
      <EmptyState
        icon={<IconAlertTriangle />}
        variant="light"
        color="red"
        title={t('ui.couldntLoad')}
        description={getErrorMessage(query.error)}
        py="xl"
      >
        <EmptyState.Actions>
          <Button variant="light" onClick={() => void query.refetch()}>
            {t('common.tryAgain')}
          </Button>
        </EmptyState.Actions>
      </EmptyState>
    );
  }
  return <>{children(query.data as TData)}</>;
};
