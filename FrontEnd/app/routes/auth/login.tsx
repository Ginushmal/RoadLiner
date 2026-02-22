import { type ActionFunctionArgs, Form, Link, redirect, useActionData } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { login } from "~/auth.server";
import { prisma } from "~/db.server";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string; // Mock auth

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.password !== password) {
    return { error: "Invalid credentials" };
  }

  return login(request, user.id);
}

export default function Login() {
  const actionData = useActionData<{ error?: string }>();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <Link to="/" className="mb-8 flex flex-col items-center gap-2">
        <img src="/my-logo.png" alt="RoadLiner Logo" className="h-12 w-auto" />
        <span className="font-bold text-2xl text-gray-900 tracking-tight">RoadLiner</span>
      </Link>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Login to RoadLiner</CardTitle>
        </CardHeader>
        <CardContent>
          <Form method="post" className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
              <Input id="email" name="email" type="email" required placeholder="user@example.com" />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
              <Input id="password" name="password" type="password" required />
            </div>
            {actionData?.error && <p className="text-red-500 text-sm">{actionData.error}</p>}
            <Button type="submit" className="w-full">Login</Button>
          </Form>
          <div className="mt-4 text-center text-sm">
            Don't have an account? <Link to="/register" className="text-blue-600 hover:underline">Register</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
