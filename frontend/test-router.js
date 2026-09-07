import { matchRoutes } from "react-router-dom";

const routes = [
  {
    path: "/b2b",
    children: [
      { path: "admin/billing" },
      { path: "admin/billing/payment" },
    ]
  }
];

const matches = matchRoutes(routes, "/b2b/admin/billing/payment");
console.log(matches);
