import "server-only";
// Minimal Stripe REST client (no SDK). Active only when STRIPE_SECRET_KEY is set.
export const stripeEnabled = () => !!process.env.STRIPE_SECRET_KEY;
export async function stripe(path: string, params?: Record<string, string>) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: params ? "POST" : "GET",
    headers: { authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, "content-type": "application/x-www-form-urlencoded" },
    body: params ? new URLSearchParams(params) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? "Stripe error");
  return data;
}
