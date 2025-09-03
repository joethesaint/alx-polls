"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createPoll, type PollFormValues } from "../../../lib/actions";

const pollSchema = z.object({
  question: z
    .string()
    .min(5, "Question must be at least 5 characters")
    .max(200, "Question must be less than 200 characters"),
  options: z
    .array(z.object({ text: z.string().min(1, "Option text is required") }))
    .min(2, "At least 2 options are required"),
});

export default function CreatePollPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const form = useForm<PollFormValues>({
    resolver: zodResolver(pollSchema),
    defaultValues: {
      question: "",
      options: [{ text: "" }, { text: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "options",
  });

  const onSubmit = async (data: PollFormValues) => {
    setIsSubmitting(true);
    setErrorMessage("");

    const result = await createPoll(data);

    if (result.success) {
      router.push("/dashboard");
    } else {
      let errorMsg = "An unknown error occurred.";
      if (
        result.errors &&
        "root" in result.errors &&
        result.errors.root?._errors?.[0]
      ) {
        errorMsg = result.errors.root._errors[0];
      } else if (
        result.errors &&
        "question" in result.errors &&
        result.errors.question?._errors?.[0]
      ) {
        errorMsg = result.errors.question._errors[0];
      } else if (
        result.errors &&
        "options" in result.errors &&
        result.errors.options?._errors?.[0]
      ) {
        errorMsg = result.errors.options._errors[0];
      }
      setErrorMessage(errorMsg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-2xl py-6">
      <div className="mb-4">
        <Link href="/dashboard" className="btn btn-ghost">
          &larr; Back to Dashboard
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">Create a New Poll</h1>

      {errorMessage && (
        <div className="p-3 border border-destructive text-destructive rounded mb-4">
          <p>{errorMessage}</p>
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="question" className="font-medium">
            Poll Question
          </label>
          <input
            id="question"
            {...form.register("question")}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="e.g., What is your favorite programming language?"
          />
          {form.formState.errors.question && (
            <p className="text-sm text-destructive">
              {form.formState.errors.question.message}
            </p>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label id="poll-options-label" className="font-medium">Poll Options</label>
            <button
              type="button"
              onClick={() => append({ text: "" })}
              className="btn btn-ghost text-sm"
            >
              + Add Option
            </button>
          </div>

          <fieldset aria-labelledby="poll-options-label" className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center space-x-2">
                <input
                  {...form.register(`options.${index}.text`)}
                  className="flex-grow px-3 py-2 border rounded-md"
                  placeholder={`Option ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => remove(index)}
                  disabled={fields.length <= 2}
                  className="btn btn-ghost disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            ))}
            {form.formState.errors.options && (
              <p className="text-sm text-destructive">
                {form.formState.errors.options.message}
              </p>
            )}
          </fieldset>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn btn-primary"
          >
            {isSubmitting ? "Creating Poll..." : "Create Poll"}
          </button>
        </div>
      </form>
    </div>
  );
}
