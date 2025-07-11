import { Prisma } from '@prisma/client';

import { appUrl } from '../../app/shared/env.server.ts';

export const teamExtension = Prisma.defineExtension({
  result: {
    team: {
      invitationLink: {
        needs: { invitationCode: true },
        compute({ invitationCode }) {
          return `${appUrl()}/invite/team/${invitationCode}`;
        },
      },
    },
  },
});
