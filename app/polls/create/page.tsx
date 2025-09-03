'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createPoll, PollFormValues } from '../../../lib/actions';

export default function CreatePollPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const form = useForm<PollFormValues>({
    resolver: zodResolver(z.object({
      title: z.string()
        .min(5, { message: 'Title must be at least 5 characters' })
        .max(100, { message: 'Title must be less than 100 characters' })
        .refine(val => val.trim().length > 0, { message: 'Title cannot be empty' }),
      question: z.string()
        .min(5, { message: 'Question must be at least 5 characters' })
        .max(200, { message: 'Question must be less than 200 characters' })
        .refine(val => val.trim().length > 0, { message: 'Question cannot be empty' }),
      description: z.string()
        .min(10, { message: 'Description must be at least 10 characters' })
        .max(500, { message: 'Description must be less than 500 characters' })
        .refine(val => val.trim().length > 0, { message: 'Description cannot be empty' }),
      isPublic: z.boolean().default(true),
      allowMultipleVotes: z.boolean().default(false),
      options: z.array(
        z.object({
          text: z.string()
            .min(1, { message: 'Option text is required' })
            .refine(val => val.trim().length > 0, { message: 'Option text cannot be empty' })
        })
      )
        .min(2, { message: 'At least 2 options are required' })
        .refine(
          options => new Set(options.map(o => o.text.trim())).size === options.length,
          { message: 'All options must be unique' }
        )
    })),
    defaultValues: {
      title: '',
      question: '',
      description: '',
      isPublic: true,
      allowMultipleVotes: false,
      options: [{ text: '' }, { text: '' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'options'
  });

  const onSubmit = async (data: PollFormValues) => {
    setIsSubmitting(true);
    
    try {
      const result = await createPoll(data);
      
      if (result.success) {
        setSuccessMessage('Poll created successfully! Redirecting to polls...');
        
        setTimeout(() => {
          router.push('/polls');
        }, 2000);
      } else {
        if (result.errors) {
          if (result.errors.title?._errors) {
            form.setError('title', { 
              type: 'manual',
              message: result.errors.title._errors[0]
            });
          }
          
          if (result.errors.question?._errors) {
            form.setError('question', { 
              type: 'manual',
              message: result.errors.question._errors[0]
            });
          }
          
          if (result.errors.description?._errors) {
            form.setError('description', { 
              type: 'manual',
              message: result.errors.description._errors[0]
            });
          }
          
          if (result.errors.options?._errors) {
            form.setError('options', { 
              type: 'manual',
              message: result.errors.options._errors[0]
            });
          }
        }
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('Error creating poll:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-2xl py-6">
      <div className="mb-4">
        <Link 
          href="/dashboard" 
          className="text-blue-500 hover:underline text-sm"
        >
          ← Back to Dashboard
        </Link>
      </div>
      
      <h1 className="text-xl font-medium mb-6">Create a New Poll</h1>
      
      {successMessage && (
        <div className="p-3 border border-green-300 text-green-600 rounded mb-4">
          <p>{successMessage}</p>
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm mb-1">
            Poll Title
          </label>
          <input
            id="title"
            {...form.register('title')}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            placeholder="Enter a descriptive title for your poll"
          />
          {form.formState.errors.title && (
            <p className="mt-1 text-sm text-red-500">{form.formState.errors.title.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="question" className="block text-sm mb-1">
            Poll Question
          </label>
          <input
            id="question"
            {...form.register('question')}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            placeholder="Enter the main question for your poll"
          />
          {form.formState.errors.question && (
            <p className="mt-1 text-sm text-red-500">{form.formState.errors.question.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm mb-1">
            Description
          </label>
          <textarea
            id="description"
            {...form.register('description')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            placeholder="Provide additional context for your poll"
          />
          {form.formState.errors.description && (
            <p className="mt-1 text-sm text-red-500">{form.formState.errors.description.message}</p>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row sm:space-x-6 space-y-2 sm:space-y-0">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublic"
              {...form.register('isPublic')}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="isPublic" className="ml-2 block text-sm">
              Make poll public
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="allowMultipleVotes"
              {...form.register('allowMultipleVotes')}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="allowMultipleVotes" className="ml-2 block text-sm">
              Allow multiple votes
            </label>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm">
              Poll Options
            </label>
            <button
              type="button"
              onClick={() => append({ text: '' })}
              className="text-xs text-blue-600 hover:underline"
            >
              + Add Option
            </button>
          </div>
          
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center">
                <input
                  {...form.register(`options.${index}.text`)}
                  className="flex-grow px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  placeholder={`Option ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => fields.length > 2 ? remove(index) : null}
                  className={`ml-2 ${fields.length > 2 ? 'text-gray-500 hover:text-red-500' : 'text-gray-300 cursor-not-allowed'}`}
                >
                  ×
                </button>
              </div>
            ))}
            {form.formState.errors.options && (
              <p className="mt-1 text-sm text-red-500">{form.formState.errors.options.message}</p>
            )}
          </div>
        </div>
        
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {isSubmitting ? 'Creating Poll...' : 'Create Poll'}
          </button>
        </div>
      </form>
    </div>
  );
}