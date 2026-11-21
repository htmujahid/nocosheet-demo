import { Fragment } from "react";

import { Link, useMatches } from "@tanstack/react-router";

import { HomeIcon } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { RouteCrumb } from "@/lib/breadcrumbs";

function resolveCrumb(crumb: RouteCrumb, loaderData: unknown) {
  return typeof crumb === "function" ? crumb(loaderData) : crumb;
}

export function WorkspaceBreadcrumbs({ workspace }: { workspace: string }) {
  const crumbs = useMatches({
    select: (matches) =>
      matches.flatMap((match) => {
        const crumb = match.staticData.crumb;
        const label = crumb ? resolveCrumb(crumb, match.loaderData) : undefined;
        return label ? [{ id: match.id, label, pathname: match.pathname }] : [];
      }),
  });
  const atHome = crumbs.length === 0;

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        <BreadcrumbItem className="shrink-0">
          {atHome ? (
            <BreadcrumbPage aria-label="Home">
              <HomeIcon className="size-4" />
            </BreadcrumbPage>
          ) : (
            <BreadcrumbLink
              aria-label="Home"
              render={<Link to="/workspaces/$workspace" params={{ workspace }} />}
            >
              <HomeIcon className="size-4" />
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1;
          return (
            <Fragment key={crumb.id}>
              <BreadcrumbSeparator className={last ? undefined : "hidden lg:block"} />
              <BreadcrumbItem className={last ? "min-w-0" : "hidden lg:inline-flex"}>
                {last ? (
                  <BreadcrumbPage className="truncate">{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link to={crumb.pathname} />}>
                    {crumb.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
