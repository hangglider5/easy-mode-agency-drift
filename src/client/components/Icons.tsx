import type { ReactNode } from "react";

export type IconName =
  | "sweep"
  | "log"
  | "playbook"
  | "templates"
  | "preferences"
  | "user"
  | "manual"
  | "settings"
  | "chevron-down";

type IconProps = {
  name: IconName;
  size?: 16 | 18;
  className?: string;
};

function paths(name: IconName): ReactNode {
  switch (name) {
    case "sweep":
      return (
        <>
          <path d="m9 1.75 1.45 1.5 2.08-.3.45 2.05 1.9.9-.9 1.9.9 1.9-1.9.9-.45 2.05-2.08-.3L9 16.25l-1.45-1.5-2.08.3L5.02 13l-1.9-.9.9-1.9-.9-1.9 1.9-.9.45-2.05 2.08.3z" />
          <path d="m6.25 9 1.8 1.8 3.7-3.8" />
        </>
      );
    case "log":
      return (
        <>
          <path d="M5 2.25h5l3 3v10.5H5z" />
          <path d="M10 2.25v3h3M7.5 9h3M7.5 12h3" />
        </>
      );
    case "playbook":
      return (
        <>
          <path d="M6 3h7v11.5H6z" />
          <path d="M6 5H3.75v10.5H11v-1M8 6.5h3M8 9.5h3" />
        </>
      );
    case "templates":
      return (
        <>
          <path d="M4 4.25h6l3 3v8.5H4z" />
          <path d="M10 4.25v3h3M6.25 2.25h5l2.75 2.75v8" />
        </>
      );
    case "preferences":
    case "settings":
      return (
        <>
          <circle cx="9" cy="9" r="2.25" />
          <path d="M9 1.75v2M9 14.25v2M1.75 9h2M14.25 9h2M3.9 3.9l1.4 1.4M12.7 12.7l1.4 1.4M14.1 3.9l-1.4 1.4M5.3 12.7l-1.4 1.4" />
        </>
      );
    case "user":
      return (
        <>
          <circle cx="9" cy="9" r="7" />
          <circle cx="9" cy="6.75" r="2" />
          <path d="M5.5 13c.8-1.7 2-2.5 3.5-2.5s2.7.8 3.5 2.5" />
        </>
      );
    case "manual":
      return <circle cx="9" cy="9" r="5.75" />;
    case "chevron-down":
      return <path d="m4 6 4 4 4-4" />;
  }
}

export function Icon({ name, size = 18, className = "" }: IconProps) {
  return (
    <svg
      className={className}
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths(name)}
    </svg>
  );
}
