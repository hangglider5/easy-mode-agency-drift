type DisclosureProps = {
  expanded: boolean;
};

export function Disclosure({ expanded }: DisclosureProps) {
  return (
    <span className="disclosure" aria-hidden="true">
      <span className={`disclosure__icon${expanded ? " is-expanded" : ""}`}>
        <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16">
          <path
            d="m6 3.5 4.5 4.5L6 12.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </span>
  );
}
