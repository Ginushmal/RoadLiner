import { type ActionFunctionArgs, Form, Link, redirect, useActionData, useSearchParams } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { login } from "~/auth.server";
import { prisma } from "~/db.server";
import type { UserRole } from "@prisma/client";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;
  const role = formData.get("role") as UserRole;

  const validRoles = ["SENDER_RECEIVER", "CROWD_DRIVER", "VAN_DRIVER"]; // Admin is private
  if (!validRoles.includes(role)) {
      return { error: "Invalid role" };
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { error: "Email already taken" };
  }

  const user = await prisma.user.create({
    data: {
      email,
      password, // In real app, hash this!
      name,
      role
    },
  });

  return login(request, user.id);
}

export default function Register() {
  const actionData = useActionData<{ error?: string }>();
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get("role") === "driver" ? "CROWD_DRIVER" : "SENDER_RECEIVER";

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Create an Account</CardTitle>
        </CardHeader>
        <CardContent>
          <Form method="post" className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">Full Name</label>
              <Input id="name" name="name" type="text" required placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input id="email" name="email" type="email" required placeholder="user@example.com" />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <Input id="password" name="password" type="password" required />
            </div>
             <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium">I want to...</label>
              <select 
                name="role" 
                id="role"
                defaultValue={defaultRole}
                className="flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950"
              >
                <option value="SENDER_RECEIVER">Send & Receive Parcels</option>
                <option value="CROWD_DRIVER">Drive & Earn</option>
                <option value="VAN_DRIVER">Operate RoadLiner Van (Demo)</option>
              </select>
            </div>

            {actionData?.error && <p className="text-red-500 text-sm">{actionData.error}</p>}
            <Button type="submit" className="w-full">Register</Button>
          </Form>
          <div className="mt-4 text-center text-sm">
            Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
