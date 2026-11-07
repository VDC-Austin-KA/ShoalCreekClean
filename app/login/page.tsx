import { Logo } from "@/components/ui";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in" };
export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  return (
    <div className="grid min-h-dvh place-items-center px-5">
      <div className="flex w-full flex-col items-center gap-8">
        <Logo />
        {error && <p className="text-sm text-rose-400">That sign-in link is invalid or expired.</p>}
        <LoginForm next={next} alpha={process.env.ALPHA_MODE === "true"} />
      </div>
    </div>
  );
}
