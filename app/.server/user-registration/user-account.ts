import { db } from 'prisma/db.server.ts';
import { sendResetPasswordEmail } from '~/emails/templates/auth/reset-password.tsx';
import { appUrl } from '~/libs/env/env.server.ts';
import { auth as firebaseAuth } from '../../libs/auth/firebase.server.ts';

type UserAccountCreateInput = {
  uid: string;
  name: string;
  email?: string;
  emailVerified?: boolean;
  picture?: string;
  provider: string;
};

export class UserAccount {
  static async register(data: UserAccountCreateInput) {
    const authentication = await db.authenticationMethod.findUnique({
      where: { uid: data.uid },
      include: { user: true },
    });

    if (authentication) return authentication.user.id;

    const {
      uid,
      name = '(No name)',
      email = `${data.uid}@example.com`,
      emailVerified,
      picture,
      provider = 'unknown',
    } = data;

    const newAuthentication = await db.authenticationMethod.create({
      data: {
        uid: uid,
        name,
        email,
        picture,
        provider,
        user: { create: { name, email, emailVerified, picture } },
      },
      include: { user: true },
    });

    return newAuthentication.user.id;
  }

  static async sendResetPasswordEmail(email: string) {
    try {
      const firebaseResetLink = await firebaseAuth.generatePasswordResetLink(email);
      const firebaseResetUrl = new URL(firebaseResetLink);
      const oobCode = firebaseResetUrl.searchParams.get('oobCode');

      if (!oobCode) return;

      const passwordResetUrl = new URL(`${appUrl()}/auth/reset-password`);
      passwordResetUrl.searchParams.set('oobCode', oobCode);
      passwordResetUrl.searchParams.set('email', email);

      await sendResetPasswordEmail({ email, passwordResetUrl: passwordResetUrl.toString() });
    } catch (_error: any) {
      console.error(_error?.message);
      return;
    }
  }
}
