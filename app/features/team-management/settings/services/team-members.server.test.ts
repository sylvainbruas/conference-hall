import { teamFactory } from 'tests/factories/team.ts';
import { userFactory } from 'tests/factories/users.ts';
import { ForbiddenOperationError } from '~/shared/errors.server.ts';
import { TeamMembers } from './team-members.server.ts';

describe('TeamMembers', () => {
  describe('list', () => {
    it('returns team members and filter them', async () => {
      const owner = await userFactory({
        traits: ['clark-kent'],
        attributes: { id: '1', picture: 'https://img.com/a.png' },
      });
      const member = await userFactory({
        traits: ['bruce-wayne'],
        attributes: { id: '2', picture: 'https://img.com/b.png' },
      });
      const reviewer = await userFactory({
        traits: ['peter-parker'],
        attributes: { id: '3', picture: 'https://img.com/c.png' },
      });
      const team = await teamFactory({
        owners: [owner],
        members: [member],
        reviewers: [reviewer],
        attributes: { slug: 'my-team' },
      });
      const other = await userFactory();
      await teamFactory({ owners: [other] });

      const data = await TeamMembers.for(owner.id, team.slug).list({}, 1);
      expect(data.pagination).toEqual({ current: 1, total: 1 });

      expect(data.members).toEqual([
        { id: '2', name: 'Bruce Wayne', role: 'MEMBER', picture: 'https://img.com/b.png' },
        { id: '1', name: 'Clark Kent', role: 'OWNER', picture: 'https://img.com/a.png' },
        { id: '3', name: 'Peter Parker', role: 'REVIEWER', picture: 'https://img.com/c.png' },
      ]);

      const filtered = await TeamMembers.for(owner.id, team.slug).list({ query: 'kent' }, 1);
      expect(filtered.members).toEqual([
        { id: '1', name: 'Clark Kent', role: 'OWNER', picture: 'https://img.com/a.png' },
      ]);

      const roleFiltered = await TeamMembers.for(owner.id, team.slug).list({ role: 'MEMBER' }, 1);
      expect(roleFiltered.members).toEqual([
        { id: '2', name: 'Bruce Wayne', role: 'MEMBER', picture: 'https://img.com/b.png' },
      ]);
    });

    it('returns nothing when user is not owner of the team', async () => {
      const user = await userFactory();
      const owner = await userFactory();
      const team = await teamFactory({ owners: [owner], attributes: { slug: 'my-team' } });

      await expect(TeamMembers.for(user.id, team.slug).list({}, 1)).rejects.toThrowError(ForbiddenOperationError);
    });
  });

  describe('leave', () => {
    it('leaves the organization as member', async () => {
      const owner = await userFactory();
      const member = await userFactory();
      const team = await teamFactory({ owners: [owner], members: [member] });

      await TeamMembers.for(member.id, team.slug).leave();

      const data = await TeamMembers.for(owner.id, team.slug).list({}, 1);
      expect(data.members).toEqual([{ id: owner.id, name: owner.name, role: 'OWNER', picture: owner.picture }]);
    });

    it('throws an error when user a owner of the team', async () => {
      const owner = await userFactory();
      const team = await teamFactory({ owners: [owner] });

      await expect(TeamMembers.for(owner.id, team.slug).leave()).rejects.toThrowError(ForbiddenOperationError);
    });

    it('throws an error when user does not belong to the team', async () => {
      const user = await userFactory();
      const owner = await userFactory();
      const team = await teamFactory({ owners: [owner] });

      await expect(TeamMembers.for(user.id, team.slug).leave()).rejects.toThrowError(ForbiddenOperationError);
    });
  });

  describe('remove', () => {
    it('removes a member from the team', async () => {
      const owner = await userFactory();
      const member = await userFactory();
      const team = await teamFactory({ owners: [owner], members: [member] });

      await TeamMembers.for(owner.id, team.slug).remove(member.id);

      const data = await TeamMembers.for(owner.id, team.slug).list({}, 1);
      expect(data.members).toEqual([{ id: owner.id, name: owner.name, role: 'OWNER', picture: owner.picture }]);
    });

    it('throws an error when user tries to remove itself', async () => {
      const owner = await userFactory();
      const team = await teamFactory({ owners: [owner] });

      await expect(TeamMembers.for(owner.id, team.slug).remove(owner.id)).rejects.toThrowError(ForbiddenOperationError);
    });

    it('throws an error when user is not owner of the team', async () => {
      const user = await userFactory();
      const owner = await userFactory();
      const team = await teamFactory({ owners: [owner] });

      await expect(TeamMembers.for(user.id, team.slug).remove(owner.id)).rejects.toThrowError(ForbiddenOperationError);
    });
  });

  describe('changeRole', () => {
    it('changes the role of a member when user has owner role', async () => {
      const owner = await userFactory();
      const member = await userFactory();
      const team = await teamFactory({ owners: [owner], members: [member] });

      await TeamMembers.for(owner.id, team.slug).changeRole(member.id, 'REVIEWER');

      const data = await TeamMembers.for(owner.id, team.slug).list({ query: member.name }, 1);
      expect(data.members).toEqual([{ id: member.id, name: member.name, role: 'REVIEWER', picture: member.picture }]);
    });

    it('throws an error when user updates its own role of the team', async () => {
      const owner = await userFactory();
      const team = await teamFactory({ owners: [owner] });

      await expect(TeamMembers.for(owner.id, team.slug).changeRole(owner.id, 'REVIEWER')).rejects.toThrowError(
        ForbiddenOperationError,
      );
    });

    it('throws an error when user is not owner of the team', async () => {
      const owner = await userFactory();
      const member = await userFactory();
      const team = await teamFactory({ owners: [owner], members: [member] });

      await expect(TeamMembers.for(member.id, team.slug).changeRole(owner.id, 'REVIEWER')).rejects.toThrowError(
        ForbiddenOperationError,
      );
    });
  });
});
