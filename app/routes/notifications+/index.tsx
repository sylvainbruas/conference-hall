import { BellSlashIcon } from '@heroicons/react/24/outline';
import { Notifications } from '~/.server/user-notifications/notifications.ts';
import { CardLink } from '~/design-system/layouts/card.tsx';
import { EmptyState } from '~/design-system/layouts/empty-state.tsx';
import { Page } from '~/design-system/layouts/page.tsx';
import { H2 } from '~/design-system/typography.tsx';
import { requireUserSession } from '~/libs/auth/session.ts';
import { mergeMeta } from '~/libs/meta/merge-meta.ts';
import { Footer } from '~/routes/components/footer.tsx';
import { Navbar } from '~/routes/components/navbar/navbar.tsx';
import type { Route } from './+types/index.ts';

export const meta = (args: Route.MetaArgs) => {
  return mergeMeta(args.matches, [{ title: 'Notifications | Conference Hall' }]);
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { userId } = await requireUserSession(request);
  return Notifications.for(userId).list();
};

export default function OrganizerRoute({ loaderData: notifications }: Route.ComponentProps) {
  const hasNotifications = Boolean(notifications && notifications.length > 0);

  return (
    <>
      <Navbar />

      <Page>
        <Page.Heading title="Notifications" subtitle="Notifications from events organizers about your proposals." />

        {hasNotifications ? (
          <ul aria-label="Notifications list" className="space-y-4">
            {notifications.map(({ event, proposal }) => (
              <CardLink
                key={`${event.slug}-${proposal.id}`}
                as="li"
                to={`/${event.slug}/proposals/${proposal.id}`}
                className="flex"
                p={4}
              >
                <div className="mt-1 flex h-6 w-6 shrink-0">🎉</div>
                <div className="ml-4">
                  <H2>
                    <strong>{proposal.title}</strong> has been accepted to <strong>{event.name}</strong>.
                  </H2>
                  <p className="text-sm text-gray-500">Please confirm or decline your participation.</p>
                </div>
              </CardLink>
            ))}
          </ul>
        ) : (
          <EmptyState label="No notifications" icon={BellSlashIcon} />
        )}
      </Page>

      <Footer />
    </>
  );
}
