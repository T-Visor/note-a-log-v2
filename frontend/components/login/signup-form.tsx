"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const SUCCESS_URL = "/success/sign-up";
const FORM_ID = "signUpForm";
const USERNAME_CHARACTER_MIN = 4;
const USERNAME_CHARACTER_MAX = 60;
const PASSWORD_CHARACTER_MIN = 8;
const PASSWORD_CHARACTER_MAX = 60;

const formSchema = z.object({
  firstName: z
    .string()
    .min(1)
    .max(60),
  lastName: z
    .string()
    .min(1)
    .max(60),
  email: z
    .email("Invalid email")
    .min(USERNAME_CHARACTER_MIN, `Miniumum characters: ${USERNAME_CHARACTER_MIN}`)
    .max(USERNAME_CHARACTER_MAX, `Maximum characters: ${USERNAME_CHARACTER_MAX}`),
  password: z
    .string()
    .min(PASSWORD_CHARACTER_MIN, `Minimum characters: ${PASSWORD_CHARACTER_MIN}`)
    .max(PASSWORD_CHARACTER_MAX, `Maximum characters: ${PASSWORD_CHARACTER_MAX}`),
  confirmPassword: z
    .string()
    .min(PASSWORD_CHARACTER_MIN, `Minimum characters: ${PASSWORD_CHARACTER_MIN}`)
    .max(PASSWORD_CHARACTER_MAX, `Maximum characters: ${PASSWORD_CHARACTER_MAX}`),
})
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  });

const SignupForm = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: ""
    },
  });

  const onSubmit = async (formData: z.infer<typeof formSchema>) => {
    const {
      firstName,
      lastName,
      email,
      password
    } = formData;

    const { data, error } = await authClient.signUp.email({
      name: `${firstName} ${lastName}`,
      email: email,
      password: password,
      callbackURL: SUCCESS_URL
    }, {
      onRequest: () => {
        setLoading(true);
      },
      onError: (context) => {
        toast.error(context.error?.message ?? "Sign-up failed");
        console.error(context.error?.message);
      },
      onSuccess: () => {
        router.push(SUCCESS_URL);
      }
    });
    setLoading(false);
  };

  return (
    <Card className="w-full sm:max-w-md dark:bg-gray-800 dark:border-0">
      <CardHeader className="flex flex-col items-center">
        <CardTitle className="text-2xl">Let's get started</CardTitle>
        <CardDescription>
          Sign up for your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id={FORM_ID}
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <fieldset
            disabled={loading}
            className="opacity-100 disabled:opacity-60"
          >
            <FieldGroup aria-disabled={loading}>
              <div className="flex justify-center items-center gap-4">
                <Controller
                  name="firstName"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel
                        htmlFor="form-rhf-demo-title">
                        First Name
                      </FieldLabel>
                      <Input
                        {...field}
                        id="form-rhf-demo-title"
                        className="w-1/2"
                        aria-invalid={fieldState.invalid}
                        placeholder="Akira"
                        autoComplete="off"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="lastName"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel
                        htmlFor="form-rhf-demo-title">
                        Last Name
                      </FieldLabel>
                      <Input
                        {...field}
                        id="form-rhf-demo-title"
                        className="w-1/2"
                        aria-invalid={fieldState.invalid}
                        placeholder="Kurusu"
                        autoComplete="off"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel
                      htmlFor="form-rhf-demo-title">
                      Email
                    </FieldLabel>
                    <Input
                      {...field}
                      id="form-rhf-demo-title"
                      aria-invalid={fieldState.invalid}
                      placeholder="email@example.com"
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="form-rhf-demo-description">
                      Password
                    </FieldLabel>
                    <Input
                      {...field}
                      id="form-rhf-demo-description"
                      type="password"
                      placeholder="Password"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="confirmPassword"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="form-rhf-demo-description">
                      Confirm Password
                    </FieldLabel>
                    <Input
                      {...field}
                      id="form-rhf-demo-description"
                      type="password"
                      placeholder="Confirm Password"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          </fieldset>
        </form>
      </CardContent>
      <CardFooter>
        <Field>
          <Button 
            disabled={loading}
            type="submit" 
            form={FORM_ID}
          >
            Sign up
          </Button>
        </Field>
      </CardFooter>
    </Card>
  );
};

export default SignupForm;