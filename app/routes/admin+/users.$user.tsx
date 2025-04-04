import { ChevronLeftIcon } from '@heroicons/react/20/solid';
import { format } from 'date-fns';
import { AdminUsers } from '~/.server/admin/admin-users.ts';
import { Card } from '~/design-system/layouts/card.tsx';
import { Page } from '~/design-system/layouts/page.tsx';
import { Link } from '~/design-system/links.tsx';
import { List } from '~/design-system/list/list.tsx';
import { H1, H2, H3, Subtitle, Text } from '~/design-system/typography.tsx';
import { requireUserSession } from '~/libs/auth/session.ts';
import type { Route } from './+types/users.$user.ts';

const DATETIME_FORMAT = 'dd/MM/yyyy HH:mm';

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { userId } = await requireUserSession(request);
  const adminUsers = await AdminUsers.for(userId);
  return adminUsers.getUserInfo(params.user);
};

export default function AdminUserRoute({ loaderData: user }: Route.ComponentProps) {
  return (
    <Page className="space-y-6">
      <Link to="/admin/users" iconLeft={ChevronLeftIcon}>
        Go back
      </Link>

      <Card className="divide-y divide-gray-100">
        <div className="px-6 py-4">
          <H1>{user.name}</H1>
          <Subtitle>{user.email}</Subtitle>
        </div>
        <dl className="divide-y divide-gray-100">
          <div className="sm:grid sm:grid-cols-4 sm:gap-4 px-6 py-3">
            <Text as="dt" size="s" weight="medium">
              Terms accepted
            </Text>
            <Text as="dd" variant="secondary" className="col-span-3">
              {user.termsAccepted ? 'Yes' : 'No'}
            </Text>
          </div>
          <div className="sm:grid sm:grid-cols-4 sm:gap-4 px-6 py-3">
            <Text as="dt" size="s" weight="medium">
              Email verified
            </Text>
            <Text as="dd" variant="secondary" className="col-span-3">
              {user.emailVerified ? 'Yes' : 'No'}
            </Text>
          </div>
          {user.lastSignInAt ? (
            <div className="sm:grid sm:grid-cols-4 sm:gap-4 px-6 py-3">
              <Text as="dt" size="s" weight="medium">
                Last signed in
              </Text>
              <Text as="dd" variant="secondary" className="col-span-3">
                {format(user.lastSignInAt, DATETIME_FORMAT)}
              </Text>
            </div>
          ) : null}
          <div className="sm:grid sm:grid-cols-4 sm:gap-4 px-6 py-3">
            <Text as="dt" size="s" weight="medium">
              Created at
            </Text>
            <Text as="dd" variant="secondary" className="col-span-3">
              {format(user.createdAt, DATETIME_FORMAT)}
            </Text>
          </div>
          <div className="sm:grid sm:grid-cols-4 sm:gap-4 px-6 py-3">
            <Text as="dt" size="s" weight="medium">
              Updated at
            </Text>
            <Text as="dd" variant="secondary" className="col-span-3">
              {format(user.updatedAt, DATETIME_FORMAT)}
            </Text>
          </div>
        </dl>
      </Card>

      <List>
        <List.Header>
          <H2 size="s">{`Authentication methods (${user.authenticationMethods.length})`}</H2>
          <Subtitle size="xs">{user.uid}</Subtitle>
        </List.Header>
        <List.Content aria-label="Authentication methods list">
          {user.authenticationMethods.map((methods) => (
            <List.Row key={methods.provider} className="py-4 px-6 flex items-center gap-2">
              <H3>{methods.provider}</H3>
              <Subtitle size="xs">{methods.email}</Subtitle>
            </List.Row>
          ))}
        </List.Content>
      </List>

      <List>
        <List.Header>
          <H2 size="s">{`Teams membership (${user.teams.length})`}</H2>
        </List.Header>
        <List.Content aria-label="Teams list">
          {user.teams.map((team) => (
            <List.Row key={team.slug} className="py-4 px-6 flex justify-between items-center">
              <div className="sm:flex gap-4 items-baseline">
                <H3>{team.name}</H3>
                <Subtitle size="xs">{team.role}</Subtitle>
              </div>
              <Text variant="secondary">{format(team.createdAt, DATETIME_FORMAT)}</Text>
            </List.Row>
          ))}
        </List.Content>
      </List>
    </Page>
  );
}
