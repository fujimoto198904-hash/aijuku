import type { AnchorHTMLAttributes } from "react";

import { withSiteBasePath } from "@/lib/site-paths";

type SiteLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
};

export default function SiteLink({ children, ...props }: SiteLinkProps) {
  return (
    <a {...props} href={withSiteBasePath(props.href)}>
      {children}
    </a>
  );
}
