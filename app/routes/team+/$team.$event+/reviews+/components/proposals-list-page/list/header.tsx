import { Checkbox } from '~/design-system/forms/checkboxes.tsx';
import { List } from '~/design-system/list/list.tsx';
import { Text } from '~/design-system/typography.tsx';

import { useCurrentTeam } from '~/routes/components/contexts/team-context.tsx';
import { DeliberationButton } from '../actions/deliberation-button.tsx';
import { ReviewsProgress } from './reviews-progress.tsx';

type Props = {
  checkboxRef: React.RefObject<HTMLInputElement | null>;
  total: number;
  totalSelected: number;
  totalReviewed: number;
  selection: string[];
  isAllPagesSelected: boolean;
};

export function ListHeader({ checkboxRef, total, totalSelected, totalReviewed, selection, isAllPagesSelected }: Props) {
  const currentTeam = useCurrentTeam();

  return (
    <List.Header className="sm:h-16">
      <div className="flex flex-col gap-4 md:flex-row md:items-center ">
        {currentTeam.userPermissions.canDeliberateEventProposals ? (
          <Checkbox aria-label="Select current page" ref={checkboxRef}>
            {totalSelected === 0 ? `${total} proposals` : `Mark ${totalSelected} selected as:`}
          </Checkbox>
        ) : (
          <Text weight="medium">{`${total} proposals`}</Text>
        )}

        {totalSelected !== 0 && (
          <div className="flex items-center gap-2">
            <DeliberationButton
              status="ACCEPTED"
              selection={selection}
              isAllPagesSelected={isAllPagesSelected}
              totalSelected={totalSelected}
            />
            <DeliberationButton
              status="PENDING"
              selection={selection}
              isAllPagesSelected={isAllPagesSelected}
              totalSelected={totalSelected}
            />
            <DeliberationButton
              status="REJECTED"
              selection={selection}
              isAllPagesSelected={isAllPagesSelected}
              totalSelected={totalSelected}
            />
          </div>
        )}
      </div>
      <ReviewsProgress reviewed={totalReviewed} total={total} />
    </List.Header>
  );
}
