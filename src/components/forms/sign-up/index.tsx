"use client";

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
import dynamic from "next/dynamic";
import { useSignUpMethod } from "@/hooks/authentication";
import Link from "next/link";
import { Loader } from "@/components/shared/loader";

const OtpInput = dynamic(() => import("./otp-input").then((m) => m.default), {
  ssr: true,
});

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const {
    onGenerateCode,
    onSignUpUser,
    register,
    errors,
    loading,
    verifying,
    code,
    setCode,
    getValues,
  } = useSignUpMethod();

  return (
    <form
      onSubmit={onSignUpUser}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <FieldGroup>
        {/* Header */}
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your details below to create your account
          </p>
        </div>

        {/* OTP Verification */}
        {verifying ? (
          <>
            <div className="flex justify-center mb-4">
              <OtpInput otp={code} setOtp={setCode} />
            </div>

            <Field>
              <Button type="submit" className="rounded-2xl w-full">
                <Loader loading={loading}>Sign Up with Email</Loader>
              </Button>
            </Field>
          </>
        ) : (
          <>
            {/* Name */}
            <Field>
              <FieldLabel htmlFor="name">Full Name</FieldLabel>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                required
                {...register("firstName")}
              />
              {errors.firstName && (
                <FieldDescription className="text-red-500 text-sm">
                  {errors.firstName.message}
                </FieldDescription>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
              <Input
                id="lastName"
                type="text"
                placeholder="Doe"
                required
                {...register("lastName")}
              />
              {errors.lastName && (
                <FieldDescription className="text-red-500 text-sm">
                  {errors.lastName.message}
                </FieldDescription>
              )}
            </Field>

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
                <FieldDescription className="text-red-500 text-sm">
                  {errors.email.message}
                </FieldDescription>
              )}
            </Field>

            {/* Password + Confirm Password */}
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  required
                  {...register("password")}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="confirmPassword">
                  Confirm Password
                </FieldLabel>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  {...register("confirmPassword")}
                />
              </Field>
            </div>

            {(errors.password || errors.confirmPassword) && (
              <FieldDescription className="text-red-500 text-sm">
                {errors.password?.message || errors.confirmPassword?.message}
              </FieldDescription>
            )}

            {/* Captcha */}
            <Field>
              <div id="clerk-captcha"></div>
            </Field>

            {/* Generate Code Button */}
            <Field>
              <Button
                type="button"
                className="rounded-md w-full"
                onClick={() =>
                  onGenerateCode({
                    email: getValues("email"),
                    password: getValues("password"),
                    firstName: getValues("firstName"),
                    lastName: getValues("lastName"),
                  })
                }
                disabled={loading}
              >
                <Loader loading={loading}>Generate Code</Loader>
              </Button>
            </Field>

            {/* Divider */}
            <FieldSeparator>Or continue with</FieldSeparator>

            {/* Google Button */}
            <Field>
              <FieldDescription className="text-center">
                Already have an account? <Link href="/sign-in">Sign in</Link>
              </FieldDescription>
            </Field>
          </>
        )}
      </FieldGroup>
    </form>
  );
}
