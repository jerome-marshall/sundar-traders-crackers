import {
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { ShopPage } from "./ShopPage";

const rootRoute = createRootRoute();
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: ShopPage,
});

const routeTree = rootRoute.addChildren([indexRoute]);

export const router = createRouter({ routeTree });
