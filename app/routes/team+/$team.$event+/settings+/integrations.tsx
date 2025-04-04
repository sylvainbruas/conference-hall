import { parseWithZod } from '@conform-to/zod';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { Form } from 'react-router';
import { z } from 'zod';
import { EventIntegrations } from '~/.server/event-settings/event-integrations.ts';
import { OpenPlannerConfigSchema } from '~/.server/event-settings/event-integrations.types.ts';
import { UserEvent } from '~/.server/event-settings/user-event.ts';
import { EventSlackSettingsSchema } from '~/.server/event-settings/user-event.types.ts';
import { Button } from '~/design-system/buttons.tsx';
import { Callout } from '~/design-system/callout.tsx';
import { Input } from '~/design-system/forms/input.tsx';
import { Card } from '~/design-system/layouts/card.tsx';
import { ExternalLink } from '~/design-system/links.tsx';
import { H2, Text } from '~/design-system/typography.tsx';
import { requireUserSession } from '~/libs/auth/session.ts';
import { toast } from '~/libs/toasts/toast.server.ts';
import { useCurrentEvent } from '~/routes/components/contexts/event-team-context.tsx';
import type { Route } from './+types/integrations.ts';

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { userId } = await requireUserSession(request);
  const eventIntegrations = EventIntegrations.for(userId, params.team, params.event);
  const openPlanner = await eventIntegrations.getConfiguration('OPEN_PLANNER');
  return { openPlanner };
};

export const action = async ({ request, params }: Route.ActionArgs) => {
  const { userId } = await requireUserSession(request);
  const form = await request.formData();
  const intent = form.get('intent');

  switch (intent) {
    case 'save-slack-integration': {
      const result = parseWithZod(form, { schema: EventSlackSettingsSchema });
      if (result.status !== 'success') return result.error;

      const event = UserEvent.for(userId, params.team, params.event);
      await event.update(result.value);
      break;
    }
    case 'save-open-planner-integration': {
      const resultId = parseWithZod(form, { schema: z.object({ id: z.string().optional() }) });
      if (resultId.status !== 'success') return toast('error', 'Something went wrong.');

      const resultConfig = parseWithZod(form, { schema: OpenPlannerConfigSchema });
      if (resultConfig.status !== 'success') return resultConfig.error;

      const eventIntegrations = EventIntegrations.for(userId, params.team, params.event);
      const data = { id: resultId.value.id, name: 'OPEN_PLANNER', configuration: resultConfig.value } as const;
      await eventIntegrations.save(data);
      return toast('success', 'OpenPlanner integration is enabled.');
    }
    case 'check-open-planner-integration': {
      const resultId = parseWithZod(form, { schema: z.object({ id: z.string().optional() }) });
      if (resultId.status !== 'success') return toast('error', 'Something went wrong.');

      const resultConfig = parseWithZod(form, { schema: OpenPlannerConfigSchema });
      if (resultConfig.status !== 'success') return resultConfig.error;

      const eventIntegrations = EventIntegrations.for(userId, params.team, params.event);
      const data = { id: resultId.value.id, name: 'OPEN_PLANNER', configuration: resultConfig.value } as const;
      const result = await eventIntegrations.checkConfiguration(data);

      if (!result?.success) return toast('error', `OpenPlanner issue: ${result?.error}`);
      return toast('success', 'OpenPlanner integration is working.');
    }
    case 'disable-integration': {
      const resultId = parseWithZod(form, { schema: z.object({ id: z.string() }) });
      if (resultId.status !== 'success') return toast('error', 'Something went wrong.');

      const eventIntegrations = EventIntegrations.for(userId, params.team, params.event);
      await eventIntegrations.delete(resultId.value.id);
      return toast('success', 'OpenPlanner integration is disabled.');
    }
  }

  return null;
};

export default function EventIntegrationsSettingsRoute({ loaderData, actionData: errors }: Route.ComponentProps) {
  const { slackWebhookUrl } = useCurrentEvent();
  const { openPlanner } = loaderData;

  return (
    <div className="space-y-8">
      <Card as="section">
        <Card.Title>
          <H2>Slack integration</H2>
        </Card.Title>

        <Card.Content>
          <Form method="POST" id="slack-integration-form">
            <Input
              name="slackWebhookUrl"
              label="Slack web hook URL"
              placeholder="https://hooks.slack.com/services/xxx-yyy-zzz"
              defaultValue={slackWebhookUrl || ''}
              error={errors?.slackWebhookUrl}
            />
          </Form>
          <Callout title="How to get the Slack web hook URL?">
            With Slack integration you will be able to received notifications about speakers in a dedicated Slack
            channel. Follow the 3 steps of the{' '}
            <ExternalLink href="https://api.slack.com/incoming-webhooks" weight="medium">
              Slack documentation
            </ExternalLink>{' '}
            to get the Incoming Web Hook URL and choose the channel.
          </Callout>
        </Card.Content>

        <Card.Actions>
          <Button type="submit" name="intent" value="save-slack-integration" form="slack-integration-form">
            Save Slack integration
          </Button>
        </Card.Actions>
      </Card>

      <Card as="section">
        <Card.Title>
          <H2>OpenPlanner integration</H2>
        </Card.Title>

        <Card.Content>
          <Text>
            Export speakers and proposals to{' '}
            <ExternalLink href="https://openplanner.fr" weight="medium">
              OpenPlanner
            </ExternalLink>
            . OpenPlanner is a SaaS app for scheduling and managing conference talks. It integrates with Conference Hall
            to schedule accepted talks, add/edit speakers and sessions, manage tracks/rooms, and handle sponsors.
          </Text>

          <Form method="POST" id="openplanner-integration-form" key={openPlanner?.id} className="space-y-4">
            <Input
              name="eventId"
              label="OpenPlanner event id"
              defaultValue={openPlanner?.configuration?.eventId ?? ''}
              error={errors?.eventId}
            />
            <Input
              name="apiKey"
              label="OpenPlanner API key"
              defaultValue={openPlanner?.configuration?.apiKey ?? ''}
              error={errors?.apiKey}
            />
            <input type="hidden" name="id" value={openPlanner?.id} />
          </Form>

          <Callout title="How to trigger the export to OpenPlanner?">
            Once you've configured your OpenPlanner event ID and API key, go to the proposals page in Conference Hall
            and click <strong>"Export &gt; To OpenPlanner"</strong>. If you've applied any filters on the proposals
            page, only the filtered proposals will be synchronized.
          </Callout>
        </Card.Content>

        <Card.Actions>
          {openPlanner ? (
            <>
              <Button
                type="submit"
                name="intent"
                value="disable-integration"
                variant="important"
                form="openplanner-integration-form"
                iconLeft={XCircleIcon}
              >
                Disable
              </Button>
              <Button
                type="submit"
                name="intent"
                value="check-open-planner-integration"
                variant="secondary"
                form="openplanner-integration-form"
                iconLeft={CheckCircleIcon}
              >
                Test connection
              </Button>
            </>
          ) : null}
          <Button type="submit" name="intent" value="save-open-planner-integration" form="openplanner-integration-form">
            Save OpenPlanner integration
          </Button>
        </Card.Actions>
      </Card>
    </div>
  );
}
