import { useTeam } from "@/context/team-context";
import useSWR from "swr";
import { z } from "zod";

import { usePlan } from "@/lib/swr/use-billing";
import { fetcher } from "@/lib/utils";

import { configSchema } from "./server";

export type LimitProps = z.infer<typeof configSchema> & {
  usage: {
    documents: number;
    links: number;
    users: number;
  };
  dataroomUpload: boolean;
};

export function useLimits() {
  const teamInfo = useTeam();
  const { isFree, isTrial } = usePlan();
  const teamId = teamInfo?.currentTeam?.id;
  const isSelfHosted = process.env.NEXT_PUBLIC_IS_SELF_HOSTED === "true";

  const { data, error } = useSWR<LimitProps | null>(
    teamId && `/api/teams/${teamId}/limits`,
    fetcher,
    {
      dedupingInterval: 30000,
    },
  );

  const canAddDocuments = isSelfHosted
    ? true
    : data?.documents
      ? data?.usage?.documents < data?.documents
      : true;
  const canAddLinks = isSelfHosted
    ? true
    : data?.links
      ? data?.usage?.links < data?.links
      : true;
  const canAddUsers = isSelfHosted
    ? true
    : data?.users
      ? data?.usage?.users < data?.users
      : true;
  const showUpgradePlanModal = isSelfHosted
    ? false
    : (isFree && !isTrial) || (isTrial && !canAddUsers);

  return {
    showUpgradePlanModal,
    limits: data,
    canAddDocuments,
    canAddLinks,
    canAddUsers,
    error,
    loading: !data && !error,
  };
}
