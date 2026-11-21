import "@tanstack/react-router";

export type RouteCrumb = string | ((loaderData: unknown) => string | undefined);

declare module "@tanstack/react-router" {
  interface StaticDataRouteOption {
    crumb?: RouteCrumb;
  }
}
