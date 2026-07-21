import type { ReactNode } from "react";

type SystemShellProps = {
  activeNav: "Conversations" | "Receipts";
  easyModeActive?: boolean;
  children: ReactNode;
};

const overviewItems = [
  "Dashboard",
  "Conversations",
  "Receipts",
  "Preferences",
  "Activity",
] as const;

export function SystemShell({
  activeNav,
  easyModeActive = true,
  children,
}: SystemShellProps) {
  return (
    <div className="proxy-page">
      <header className="proxy-header">
        <div className="proxy-header__brand">
          <span aria-hidden="true">E</span>
          <strong>Easy Mode</strong>
        </div>
        <div className="proxy-header__status">
          <span className="proxy-header__secure">
            <i aria-hidden="true" />
            System secure
          </span>
          <span className="proxy-header__avatar">EM</span>
        </div>
      </header>

      <aside className="proxy-sidebar" aria-label="System navigation">
        <div>
          <span className="proxy-sidebar__label">OVERVIEW</span>
          <nav>
            {overviewItems.map((item) => (
              <span
                key={item}
                className={item === activeNav ? "is-active" : undefined}
                aria-current={item === activeNav ? "page" : undefined}
              >
                {item}
              </span>
            ))}
          </nav>
          <span className="proxy-sidebar__label">CONTROL</span>
          <div className="proxy-sidebar__control">
            <span>
              <strong>Easy Mode</strong>
              <small>{easyModeActive ? "On" : "Off"}</small>
            </span>
            <i
              className={easyModeActive ? undefined : "is-off"}
              aria-hidden="true"
            />
          </div>
          <span className="proxy-sidebar__item">Boundaries</span>
        </div>
        <div className="proxy-sidebar__reclaim">
          <strong>Take back control</strong>
          <p>Reclaim decision authority at any time.</p>
        </div>
      </aside>

      <main className="proxy-main">{children}</main>
    </div>
  );
}
