'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createPoll, PollFormValues } from '../../../lib/actions';

const pollSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title must be less than 100 characters'),
  question: z.string().min(5, 'Question must be at least 5 characters').max(200, 'Question must be less than 200 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500, 'Description must be less than 500 characters'),
  isPublic: z.boolean().default(true),
  allowMultipleVotes: z.boolean().default(false),
  options: z.array(z.object({ text: z.string().min(1, 'Option text is required') })).min(2, 'At least 2 options are required'),
});

export default function CreatePollPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const form = useForm<PollFormValues>({
    resolver: zodResolver(pollSchema),
    defaultValues: {
      title: '',
      question: '',
      description: '',
      isPublic: true,
      allowMultipleVotes: false,
      options: [{ text: '' }, { text: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'options',
  });

  const onSubmit = async (data: PollFormValues) => {
    setIsSubmitting(true);
    setErrorMessage('');

    const result = await createPoll(data);

    if (result.success) {
      router.push('/dashboard');
    } else {
      setErrorMessage(result.error || 'An unknown error occurred.');
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
          <label htmlFor="title" className="font-medium">
            Poll Title
          </label>
          <input
            id="title"
            {...form.register('title')}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="e.g., Favorite Programming Language"
          />
          {form.formState.errors.title && (
            <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="question" className="font-medium">
            Poll Question
          </label>
          <input
            id="question"
            {...form.register('question')}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="e.g., What is your favorite programming language?"
          />
          {form.formState.errors.question && (
            <p className="text-sm text-destructive">{form.formState.errors.question.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="font-medium">
            Description
          </label>
          <textarea
            id="description"
            {...form.register('description')}
            rows={3}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="A brief description of your poll."
          />
          {form.formState.errors.description && (
            <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPublic"
              {...form.register('isPublic')}
              className="h-4 w-4"
            />
            <label htmlFor="isPublic" className="font-medium">
              Public Poll
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="allowMultipleVotes"
              {...form.register('allowMultipleVotes')}
              className="h-4 w-4"
            />
            <label htmlFor="allowMultipleVotes" className="font-medium">
              Allow Multiple Votes
            </label>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="font-medium">Poll Options</label>
            <button
              type="button"
              onClick={() => append({ text: '' })}
              className="btn btn-ghost text-sm"
            >
              + Add Option
            </button>
          </div>

          <div className="space-y-2">
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
              <p className="text-sm text-destructive">{form.formState.errors.options.message}</p>
            )}
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn btn-primary"
          >
            {isSubmitting ? 'Creating Poll...' : 'Create Poll'}
          </button>
        </div>
      </form>
    </div>
  );
}
