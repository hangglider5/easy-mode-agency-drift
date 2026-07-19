import type { DecisionSweepApi } from "../lib/apiClient";
import { DecisionSweepPage } from "../features/sweep/DecisionSweepPage";

type AppRoutesProps = {
  profileId: string;
  api: DecisionSweepApi;
};

export function AppRoutes({ profileId, api }: AppRoutesProps) {
  return <DecisionSweepPage profileId={profileId} api={api} />;
}
