import { useRef, useState } from "react";
import type { CompareResponse } from "../../shared/apiSchemas";
import { Button } from "../components/Button";
import { ProxyRevealPage } from "../features/proxy/ProxyRevealPage";
import type { DecisionSweepApi } from "../lib/apiClient";
import { DecisionSweepPage } from "../features/sweep/DecisionSweepPage";

export type ProxyComparisonApi = {
  compareProfile(
    profileId: string,
    decisionId: string,
  ): Promise<CompareResponse>;
};

type AppRoutesProps = {
  profileId: string;
  api: DecisionSweepApi & Partial<ProxyComparisonApi>;
};

export function AppRoutes({ profileId, api }: AppRoutesProps) {
  if (
    typeof window !== "undefined" &&
    window.location.pathname === "/proxy"
  ) {
    const decisionId = new URLSearchParams(window.location.search).get(
      "decisionId",
    );
    if (!api.compareProfile) {
      return (
        <section className="proxy-launch" role="alert">
          <h1>Proxy You is unavailable</h1>
        </section>
      );
    }
    return (
      <ProxyRoutePage
        profileId={profileId}
        decisionId={decisionId}
        api={{ compareProfile: api.compareProfile }}
      />
    );
  }
  return <DecisionSweepPage profileId={profileId} api={api} />;
}

type ProxyRoutePageProps = {
  profileId: string;
  decisionId: string | null;
  api: ProxyComparisonApi;
};

export function ProxyRoutePage({
  profileId,
  decisionId,
  api,
}: ProxyRoutePageProps) {
  const [result, setResult] = useState<CompareResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const inFlight = useRef(false);

  if (result) {
    return (
      <ProxyRevealPage
        comparison={result.comparison}
        lineage={result.lineage}
      />
    );
  }

  async function reveal() {
    if (!decisionId || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(false);
    try {
      setResult(await api.compareProfile(profileId, decisionId));
    } catch {
      setError(true);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return (
    <section className="proxy-launch">
      <span>COUNTERFACTUAL REVEAL</span>
      <h1>Meet Proxy You</h1>
      <p>
        Easy Mode will run the same decision twice: once using only what you
        declared, then again using everything it learned from your choices.
      </p>
      {!decisionId ? (
        <p role="alert">Choose a decision before opening Proxy You.</p>
      ) : null}
      {error ? (
        <p role="alert">
          Proxy You could not be revealed. Check the decision and Proxy
          consent, then try again.
        </p>
      ) : null}
      <Button disabled={!decisionId || busy} onClick={reveal}>
        {busy ? "Revealing…" : "Reveal Proxy You"}
      </Button>
    </section>
  );
}
