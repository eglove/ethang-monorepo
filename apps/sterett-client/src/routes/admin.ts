import { createFileRoute } from "@tanstack/react-router";
import constant from "lodash/constant.js";

export const Route = createFileRoute("/admin")({
  beforeLoad() {
    globalThis.location.href = "https://admin.sterettcreekvillagetrustee.com";
  },
  component: constant(null),
});
