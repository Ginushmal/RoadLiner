import { redirect } from "react-router";
import { prisma } from "./db.server";
import { getSession, commitSession, destroySession } from "./sessions.server";
import type { UserRole } from "@prisma/client";

export async function getUserId(request: Request) {
  const session = await getSession(request.headers.get("Cookie"));
  return session.get("userId");
}

export async function getUser(request: Request) {
  const userId = await getUserId(request);
  if (!userId) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    return user;
  } catch {
    throw logout(request);
  }
}

export async function requireUser(request: Request) {
  const userId = await getUserId(request);
  if (!userId) {
    throw redirect("/login", {
      headers: {
        "Set-Cookie": await commitSession(await getSession(request.headers.get("Cookie"))),
      },
    });
  }
  return userId;
}

export async function requireRole(request: Request, allowedRoles: string[]) {
    const user = await getUser(request);
    if (!user || !allowedRoles.includes(user.role)) {
        throw redirect("/login");
    }
    return user;
}

export async function login(request: Request, userId: string) {
  const session = await getSession(request.headers.get("Cookie"));
  session.set("userId", userId);
  
  // Determine redirect based on role
  const user = await prisma.user.findUnique({ where: { id: userId } });
  let redirectTo = "/dashboard";
  if (user?.role === "CROWD_DRIVER") redirectTo = "/driver";
  if (user?.role === "VAN_DRIVER") redirectTo = "/van";
  if (user?.role === "ADMIN") redirectTo = "/admin";

  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}

export async function logout(request: Request) {
  const session = await getSession(request.headers.get("Cookie"));
  return redirect("/", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
}
