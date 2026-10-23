// Simple line icons for profile links, drawn in the same stroke style as the theme toggle.

export type LinkIconName = 'scholar' | 'orcid' | 'linkedin' | 'github';

const paths: Record<LinkIconName, React.ReactNode> = {
  scholar: (
    <>
      <path d="M2 9.5 12 4.5l10 5-10 5-10-5Z" />
      <path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5" />
      <path d="M22 9.5V15" />
    </>
  ),
  orcid: (
    <>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M8.5 10.5V16.5" />
      <path d="M8.5 7.6v.1" />
      <path d="M11.5 7.5v9h2a4.5 4.5 0 0 0 0-9h-2Z" />
    </>
  ),
  linkedin: (
    <>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6Z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </>
  ),
  github: (
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  ),
};

export function LinkIcon({ name }: { name: LinkIconName }) {
  return (
    <svg className="link-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {paths[name]}
    </svg>
  );
}
