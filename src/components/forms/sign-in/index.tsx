"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useSignInMethod } from "@/hooks/authentication";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { Loader } from "@/components/shared/loader";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const { onAuthenticateUser, isPending, register, errors } = useSignInMethod();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form
      onSubmit={onAuthenticateUser}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <FieldGroup>
        {/* Header */}
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Sign In to OneFlow</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your email below to access your account
          </p>
        </div>

        {/* Email */}
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            required
            {...register("email")}
          />
          {errors.email && (
            <FieldDescription className="text-red-300 text-sm">
              {errors.email.message}
            </FieldDescription>
          )}
        </Field>

        {/* Password */}
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Link
              href="/reset-pass"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </Link>
          </div>

          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              {...register("password")}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          {errors.password && (
            <FieldDescription className="text-red-500 text-sm">
              {errors.password.message}
            </FieldDescription>
          )}
        </Field>

        {/* Submit */}
        <Field>
          <Button
            type="submit"
            disabled={isPending}
            className="rounded-2xl w-full"
          >
            <Loader loading={isPending}>Login</Loader>
          </Button>
        </Field>

        {/* Separator */}
        <FieldSeparator>Or continue with</FieldSeparator>

        {/* Sign Up Link */}
        <div className="text-center text-sm">
          <span className="text-muted-foreground">Don't have an account? </span>
          <Link href="/sign-up" className="text-primary hover:underline font-medium">
            Sign up
          </Link>
        </div>
      </FieldGroup>
    </form>
  );
}
