import { Indicator } from '@mantine/core';
import { IconListCheck, IconSettings } from '@tabler/icons-react';
import { Link, Outlet, type LinkProps } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { useMyInvitationsQuery } from '@/features/invitations/api';
import classes from './TabsLayout.module.css';

interface TabItem {
  to: LinkProps['to'];
  label: string;
  icon: ReactNode;
  badge?: number;
}

/** Layout for top-level screens: content + bottom tab bar (Material 3 style). */
export const TabsLayout = () => {
  const { data: invitations = [] } = useMyInvitationsQuery();

  const tabs: TabItem[] = [
    { to: '/', label: 'Lists', icon: <IconListCheck size={22} />, badge: invitations.length },
    { to: '/settings', label: 'Settings', icon: <IconSettings size={22} /> },
  ];

  return (
    <>
      <main className={classes.main}>
        <Outlet />
      </main>
      <nav className={classes.tabbar} aria-label="Main">
        <div className={classes.tabs}>
          {tabs.map((tab) => (
            <Link key={tab.label} to={tab.to} className={classes.tab} activeOptions={{ exact: true }}>
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
