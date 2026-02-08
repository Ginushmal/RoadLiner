import { type ActionFunctionArgs, redirect } from "react-router";
import { logout } from "~/auth.server";

export async function loader({ request }: ActionFunctionArgs) {
  return logout(request);
}
