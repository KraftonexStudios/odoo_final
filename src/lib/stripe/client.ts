import Stripe from "stripe";

// Server-side Stripe instance
// if (!process.env.STRIPE_SECRET_KEY) {
//   throw new Error("STRIPE_SECRET_KEY not defined");
//   console.log(process.env.STRIPE_SECRET_KEY);
// }
// export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {apiVersion: "2025-09-30.clover"});
console.log("STRIPE_SECRET_KEY:", process.env.STRIPE_SECRET_KEY);

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-29.clover",
  typescript: true,
});

// Client-side publishable key
export const getStripePublishableKey = () => {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!;
};
