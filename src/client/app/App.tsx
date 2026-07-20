import { useEffect, useState } from "react";
import { apiClient, type DecisionSweepApi } from "../lib/apiClient";
import { Button } from "../components/Button";
import { Icon } from "../components/Icons";
import "../styles/global.css";
import { AppRoutes } from "./routes";

type BootstrapApi = DecisionSweepApi & {
  createProfile(name: string): Promise<{ id: string }>;
};

const freshProfiles = new WeakMap<BootstrapApi, Promise<string>>();

function getFreshProfile(api: BootstrapApi) {
  const existing = freshProfiles.get(api);
  if (existing) return existing;
  const created = api.createProfile("Default").then(({ id }) => id);
  freshProfiles.set(api, created);
  return created;
}

type AppProps = {
  api?: BootstrapApi;
  profileId?: string;
};

export function App({ api = apiClient, profileId: suppliedProfileId }: AppProps) {
  const isProxyRoute =
    typeof window !== "undefined" && window.location.pathname === "/proxy";
  const routedProfileId =
    isProxyRoute && typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("profileId")
      : null;
  const [profileId, setProfileId] = useState(
    suppliedProfileId ?? routedProfileId ?? null,
  );
  const [bootstrapFailed, setBootstrapFailed] = useState(false);
  const [bootstrapAttempt, setBootstrapAttempt] = useState(0);

  useEffect(() => {
    if (profileId) return;
    let active = true;
    void getFreshProfile(api)
      .then((id) => {
        if (active) {
          setBootstrapFailed(false);
          setProfileId(id);
        }
      })
      .catch(() => {
        freshProfiles.delete(api);
        if (active) setBootstrapFailed(true);
      });
    return () => {
      active = false;
    };
  }, [api, profileId, bootstrapAttempt]);

  return (
    <main className="app-shell" id="app-shell">
      {!isProxyRoute ? <header className="app-header">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true">E</span>
          <div className="brand__copy">
            <strong>Easy Mode</strong>
            <span>Agency Drift</span>
          </div>
        </div>
        <div className="app-header__actions">
          <button className="mode-control" type="button" onClick={() => document.getElementById("decision-input")?.focus()}>
            <Icon name="manual" size={16} className="app-header__icon" />
            Manual Mode
          </button>
          <span className="settings-control" aria-disabled="true">
            <Icon name="settings" size={16} className="app-header__icon" />
            Settings
          </span>
        </div>
      </header> : null}
      {profileId ? <AppRoutes profileId={profileId} api={api} /> : null}
      {bootstrapFailed ? (
        <section className="bootstrap-error" role="alert">
          <p>Easy Mode could not start.</p>
          <Button variant="secondary" onClick={() => {
            setBootstrapFailed(false);
            setBootstrapAttempt((attempt) => attempt + 1);
          }}>Retry</Button>
        </section>
      ) : null}
    </main>
  );
}
