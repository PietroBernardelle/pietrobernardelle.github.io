import type { ReactNode } from 'react';

export function ExternalLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  if (href.startsWith('mailto:')) {
    return <a className={className} href={href}>{children}</a>;
  }
  return (
    <a className={className} href={href} target="_blank" rel="noreferrer">
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
