import type { AnchorHTMLAttributes } from 'react';

import { withSiteBasePath } from '@/lib/site-paths';
import { portfolioOnly, isPortfolioClosedPage } from '@/lib/site-features';

type SiteLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
};

export default function SiteLink({ children, ...props }: SiteLinkProps) {
  if (
    portfolioOnly &&
    (isPortfolioClosedPage(props.href) || /^(mailto:|tel:)/i.test(props.href))
  )
    return null;
  return (
    <a {...props} href={withSiteBasePath(props.href)}>
      {children}
    </a>
  );
}
