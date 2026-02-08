import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/auth/login.tsx"),
  route("register", "routes/auth/register.tsx"),
  route("logout", "routes/auth/logout.tsx"),
  
  layout("routes/layouts/dashboard-layout.tsx", [
    route("dashboard", "routes/dashboard/overview.tsx"),
    route("send", "routes/dashboard/send-parcel.tsx"),
    route("parcels/:id", "routes/dashboard/parcel-detail.tsx"),
  ]),

  layout("routes/layouts/driver-layout.tsx", [
    route("driver", "routes/driver/dashboard.tsx"),
    route("driver/jobs", "routes/driver/jobs.tsx"),
  ]),

   layout("routes/layouts/van-layout.tsx", [
    route("van", "routes/van/dashboard.tsx"),
  ]),

  layout("routes/layouts/admin-layout.tsx", [
    route("admin", "routes/admin/dashboard.tsx"),
    route("admin/stations/new", "routes/admin/stations/new.tsx"),
    route("admin/routes/new", "routes/admin/routes/new.tsx"),
    route("admin/routes/:id/edit", "routes/admin/routes/edit.tsx"),
  ]),

  route("track/:trackingId", "routes/public/track.tsx"),
  
] satisfies RouteConfig;
