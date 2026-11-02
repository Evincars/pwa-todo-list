import { Avatar, Tooltip, type AvatarProps } from '@mantine/core';

export interface AvatarUser {
  displayName: string;
  photoURL?: string | null;
}

export interface UserAvatarProps extends Omit<AvatarProps, 'src' | 'name'> {
  user: AvatarUser;
  withTooltip?: boolean;
}

export const UserAvatar = ({ user, withTooltip = false, ...props }: UserAvatarProps) => {
  const avatar = <Avatar src={user.photoURL ?? undefined} name={user.displayName} color="initials" alt={user.displayName} {...props} />;
  return withTooltip ? <Tooltip label={user.displayName}>{avatar}</Tooltip> : avatar;
};

export interface AvatarStackProps {
  users: readonly AvatarUser[];
  max?: number;
  size?: AvatarProps['size'];
}

/** Overlapping avatars with "+N" overflow. */
export const AvatarStack = ({ users, max = 3, size = 'sm' }: AvatarStackProps) => {
  const visible = users.slice(0, max);
  const rest = users.length - visible.length;
  return (
    <Avatar.Group spacing="xs">
      {visible.map((user, index) => (
        <UserAvatar key={`${user.displayName}-${index}`} user={user} size={size} withTooltip />
      ))}
      {rest > 0 && (
        <Avatar size={size} radius="xl">
          +{rest}
        </Avatar>
      )}
    </Avatar.Group>
  );
};
