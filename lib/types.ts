import { z } from "zod";

// Common action result type
export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  errors?: {
    root?: {
      _errors: string[];
    };
    [key: string]: unknown;
  };
}

// Vote-related types
export const voteSchema = z.object({
  pollId: z.string().uuid(),
  optionId: z.string().uuid(),
});

export type VoteFormValues = z.infer<typeof voteSchema>;

// Poll-related types
export interface Poll {
  id: string;
  question: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  poll_options: PollOption[];
}

export interface PollOption {
  id: string;
  poll_id: string;
  text: string;
  votes: number;
  created_at: string;
}

export interface Vote {
  id: string;
  poll_id: string;
  option_id: string;
  user_id?: string;
  voter_ip?: string;
  created_at: string;
}

// Authentication types
export interface AuthUser {
  id: string;
  email?: string;
}

export interface AuthSession {
  user: AuthUser;
  access_token: string;
  refresh_token: string;
}