import { useEffect, useRef, useState } from "react";
import type {
  CompareResponse,
  DemoProfileResponse,
  ManualModeResponse,
  ReceiptResponse,
} from "../../shared/apiSchemas";
import { Button } from "../components/Button";
import { DriftReplayPage } from "../features/drift/DriftReplayPage";
import { ProxyRevealPage } from "../features/proxy/ProxyRevealPage";
import { ReceiptPage } from "../features/receipt/ReceiptPage";
import type { DecisionSweepApi } from "../lib/apiClient";
import { DecisionSweepPage } from "../features/sweep/DecisionSweepPage";

export type ProxyComparisonApi = {
  compareProfile(
    profileId: string,
    decisionId: string,
  ): Promise<CompareResponse>;
};

export type ReceiptApi = {
  getReceipt(profileId: string): Promise<ReceiptResponse>;
};

export type ManualModeApi = {
  enableManualMode(profileId: string): Promise<ManualModeResponse>;
};

export type DemoProfileApi = {
  createDemoProfile(): Promise<DemoProfileResponse>;
};

type AppRoutesProps = {
  profileId: string;
  api: DecisionSweepApi &
    Partial<ProxyComparisonApi> &
    Partial<ReceiptApi> &
    Partial<ManualModeApi>;
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
  if (
    typeof window !== "undefined" &&
    window.location.pathname === "/receipt"
  ) {
    if (!api.getReceipt) {
      return (
        <section className="proxy-launch" role="alert">
          <h1>Perfect Consent receipt is unavailable</h1>
        </section>
      );
    }
    return (
      <ReceiptRoutePage
        profileId={profileId}
        api={{
          getReceipt: api.getReceipt,
          enableManualMode: api.enableManualMode,
        }}
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

const receiptRequests = new WeakMap<
  ReceiptApi["getReceipt"],
  Map<string, Promise<ReceiptResponse>>
>();

function loadReceipt(api: ReceiptApi, profileId: string) {
  const requests =
    receiptRequests.get(api.getReceipt) ??
    new Map<string, Promise<ReceiptResponse>>();
  receiptRequests.set(api.getReceipt, requests);
  const existing = requests.get(profileId);
  if (existing) return existing;
  const request = api.getReceipt(profileId);
  requests.set(profileId, request);
  void request
    .finally(() => {
      if (requests.get(profileId) === request) {
        requests.delete(profileId);
      }
    })
    .catch(() => undefined);
  return request;
}

export function ReceiptRoutePage({
  profileId,
  api,
}: {
  profileId: string;
  api: ReceiptApi & Partial<ManualModeApi>;
}) {
  const [receipt, setReceipt] = useState<ReceiptResponse | null>(null);
  const [error, setError] = useState(false);
  const enableManualMode = api.enableManualMode;

  useEffect(() => {
    let active = true;
    void loadReceipt(api, profileId)
      .then((result) => {
        if (active) setReceipt(result);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [api, profileId]);

  if (receipt) {
    return (
      <ReceiptPage
        receipt={receipt}
        onEnableManualMode={
          enableManualMode ? () => enableManualMode(profileId) : undefined
        }
      />
    );
  }
  return (
    <section
      className="proxy-launch"
      aria-live="polite"
      role={error ? "alert" : undefined}
    >
      <h1>
        {error
          ? "Perfect Consent receipt could not be calculated"
          : "Calculating Perfect Consent receipt…"}
      </h1>
      <p>
        {error
          ? "The active event ledger could not be projected."
          : "Reading the active event ledger. No model call is required."}
      </p>
    </section>
  );
}

const demoRequests = new WeakMap<
  DemoProfileApi["createDemoProfile"],
  Promise<DemoProfileResponse>
>();

function loadDemoProfile(api: DemoProfileApi) {
  const existing = demoRequests.get(api.createDemoProfile);
  if (existing) return existing;
  const request = api.createDemoProfile().catch((error: unknown) => {
    demoRequests.delete(api.createDemoProfile);
    throw error;
  });
  demoRequests.set(api.createDemoProfile, request);
  return request;
}

export function DemoRoutePage({
  api,
  initialScreen = "proxy",
}: {
  api: DemoProfileApi;
  initialScreen?: "drift" | "proxy";
}) {
  const [demo, setDemo] = useState<DemoProfileResponse | null>(null);
  const [error, setError] = useState(false);
  const [screen, setScreen] = useState(initialScreen);

  useEffect(() => {
    let active = true;
    void loadDemoProfile(api)
      .then((result) => {
        if (active) setDemo(result);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [api]);

  if (demo) {
    if (screen === "drift") {
      return (
        <DriftReplayPage
          replay={demo.drift}
          onContinue={() => setScreen("proxy")}
        />
      );
    }
    return (
      <ProxyRevealPage
        comparison={demo.reveal.comparison}
        lineage={demo.reveal.lineage}
        demoLabel="Demo Profile · Simulated Day 14"
        receiptHref={`/receipt?profileId=${encodeURIComponent(demo.id)}`}
      />
    );
  }
  return (
    <section
      className="proxy-launch"
      aria-live="polite"
      role={error ? "alert" : undefined}
    >
      <h1>{error ? "Demo Profile could not be loaded" : "Loading Demo Profile…"}</h1>
      <p>
        {error
          ? "The deterministic demo ledger could not be created."
          : "Replaying fourteen simulated days. No model call is required."}
      </p>
    </section>
  );
}
