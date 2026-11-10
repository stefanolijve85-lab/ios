import NextLink from "next/link";
import type { ComponentProps } from "react";

/**
 * Link die normaal next/link is. In de statische preview (NEXT_PUBLIC_PLAIN_LINKS=1)
 * wordt het een gewone <a>, zodat relatieve links ook vanuit een submap werken.
 */
export default function Link(props: ComponentProps<typeof NextLink>) {
  if (process.env.NEXT_PUBLIC_PLAIN_LINKS === "1") {
    const { href, prefetch, replace, scroll, shallow, passHref, legacyBehavior, locale, ...rest } = props;
    void prefetch; void replace; void scroll; void shallow; void passHref; void legacyBehavior; void locale;
    return <a href={typeof href === "string" ? href : String(href.pathname ?? "/")} {...rest} />;
  }
  return <NextLink {...props} />;
}
