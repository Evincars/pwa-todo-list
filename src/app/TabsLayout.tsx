import { Indicator } from '@mantine/core';
import { IconListCheck, IconSettings } from '@tabler/icons-react';
import { Link, Outlet, type LinkProps } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { useMyInvitationsQuery } from '@/features/invitations/api';
import { useTranslation } from '@/i18n';
import classes from './TabsLayout.module.css';

interface TabItem {
  to: NonNullable<LinkProps['to']>;
  label: string;
  icon: ReactNode;
  badge?: number;
}

/** Layout for top-level screens: content + bottom tab bar (Material 3 style). */
export const TabsLayout = () => {
  const { data: invitations = [] } = useMyInvitationsQuery();
  const { t } = useTranslation();

  const tabs: TabItem[] = [
    { to: '/', label: t('tabs.lists'), icon: <IconListCheck size={22} />, badge: invitations.length },
    { to: '/settings', label: t('tabs.settings'), icon: <IconSettings size={22} /> },
  ];

  return (
    <>
      <main className={classes.main}>
        <Outlet />
      </main>
      <nav className={classes.tabbar} aria-label={t('tabs.main')}>
        <div className={classes.tabs}>
          {tabs.map((tab) => (
            <Link key={tab.to} to={tab.to} className={classes.tab} activeOptions={{ exact: true }}>
              <span className={classes.indicator}>
                <Indicator disabled={!tab.badge} label={tab.badge} size={16} offset={2}>
                  {tab.icon}
                </Indicator>
              </span>
              {tab.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
};
