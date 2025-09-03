import { createPoll, deletePoll, updatePoll, type PollFormValues } from '../../lib/actions';
import { supabase } from '../../lib/supabase';
import { revalidatePath } from 'next/cache';
import { isDevMode } from '../../lib/dev-auth';

// Mock dependencies
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(),
      })),
    })),
  },
}));

jest.mock('next/cache');
jest.mock('../../lib/dev-auth');

const mockSupabase = supabase as jest.Mocked<typeof supabase>;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>;
const mockIsDevMode = isDevMode as jest.MockedFunction<typeof isDevMode>;

describe('Poll Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.error to prevent it from appearing in test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createPoll', () => {
    const validPollData: PollFormValues = {
      title: 'Test Poll Title',
      description: 'This is a test poll description that is long enough',
      isPublic: true,
      allowMultipleVotes: false,
      options: [
        { text: 'Option 1' },
        { text: 'Option 2' },
      ],
    };

    it('should create a poll successfully with authenticated user', async () => {
      // Mock authenticated session
      const mockSession = {
        user: { id: 'user-123' },
      };
      (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });
      mockIsDevMode.mockReturnValue(false);

      // Mock successful poll creation
      const mockPoll = { id: 'poll-123', ...validPollData };
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockPoll, error: null }),
        }),
      });
      mockSupabase.from.mockReturnValue({ insert: mockInsert } as any);

      const result = await createPoll(validPollData);

      expect(result).toEqual({
        success: true,
        pollId: 'poll-123',
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard');
    });

    it('should create a poll in dev mode without authentication', async () => {
      // Mock no session but dev mode enabled
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });
      mockIsDevMode.mockReturnValue(true);

      // Mock successful poll creation
      const mockPoll = { id: 'poll-123', ...validPollData };
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockPoll, error: null }),
        }),
      });
      mockSupabase.from.mockReturnValue({ insert: mockInsert } as any);

      const result = await createPoll(validPollData);

      expect(result).toEqual({
        success: true,
        pollId: 'poll-123',
      });
    });

    it('should fail when user is not authenticated and not in dev mode', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });
      mockIsDevMode.mockReturnValue(false);

      const result = await createPoll(validPollData);

      expect(result).toEqual({
        success: false,
        errors: { root: { _errors: ['You must be logged in to create a poll'] } },
      });
    });

    it('should fail with validation errors for invalid data', async () => {
      const invalidPollData = {
        title: 'Hi', // Too short
        description: 'Short', // Too short
        isPublic: true,
        allowMultipleVotes: false,
        options: [{ text: 'Only one option' }], // Not enough options
      };

      const result = await createPoll(invalidPollData as PollFormValues);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should fail when database insert fails', async () => {
      const mockSession = {
        user: { id: 'user-123' },
      };
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });
      mockIsDevMode.mockReturnValue(false);

      // Mock database error
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } }),
        }),
      });
      mockSupabase.from.mockReturnValue({ insert: mockInsert } as any);

      const result = await createPoll(validPollData);

      expect(result).toEqual({
        success: false,
        errors: { root: { _errors: ['Failed to create poll. Please try again.'] } },
      });
    });

    it('should handle duplicate options validation', async () => {
      const duplicateOptionsData = {
        ...validPollData,
        options: [
          { text: 'Same Option' },
          { text: 'Same Option' }, // Duplicate
        ],
      };

      const result = await createPoll(duplicateOptionsData);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should handle maximum number of options', async () => {
      const maxOptionsData = {
        ...validPollData,
        options: Array.from({ length: 10 }, (_, i) => ({ text: `Option ${i + 1}` })),
      };

      const mockSession = { user: { id: 'user-123' } };
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });
      mockIsDevMode.mockReturnValue(false);

      const mockPoll = { id: 'poll-123', ...maxOptionsData };
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockPoll, error: null }),
        }),
      });
      mockSupabase.from.mockReturnValue({ insert: mockInsert } as any);

      const result = await createPoll(maxOptionsData);

      expect(result.success).toBe(true);
      expect(result.pollId).toBe('poll-123');
    });

    it('should fail when exceeding maximum options limit', async () => {
      const tooManyOptionsData = {
        ...validPollData,
        options: Array.from({ length: 11 }, (_, i) => ({ text: `Option ${i + 1}` })),
      };

      const result = await createPoll(tooManyOptionsData as PollFormValues);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should handle empty option text validation', async () => {
      const emptyOptionData = {
        ...validPollData,
        options: [
          { text: 'Valid Option' },
          { text: '' }, // Empty option
        ],
      };

      const result = await createPoll(emptyOptionData as PollFormValues);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should handle very long poll title', async () => {
      const longTitleData = {
        ...validPollData,
        title: 'A'.repeat(201), // Exceeds 200 character limit
      };

      const result = await createPoll(longTitleData as PollFormValues);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should handle very long poll description', async () => {
      const longDescriptionData = {
        ...validPollData,
        description: 'A'.repeat(1001), // Exceeds 1000 character limit
      };

      const result = await createPoll(longDescriptionData as PollFormValues);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should create private poll successfully', async () => {
      const privatePollData = {
        ...validPollData,
        isPublic: false,
      };

      const mockSession = { user: { id: 'user-123' } };
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });
      mockIsDevMode.mockReturnValue(false);

      const mockPoll = { id: 'poll-123', ...privatePollData };
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockPoll, error: null }),
        }),
      });
      mockSupabase.from.mockReturnValue({ insert: mockInsert } as any);

      const result = await createPoll(privatePollData);

      expect(result.success).toBe(true);
      expect(result.pollId).toBe('poll-123');
    });

    it('should create poll with multiple votes allowed', async () => {
      const multipleVotesPollData = {
        ...validPollData,
        allowMultipleVotes: true,
      };

      const mockSession = { user: { id: 'user-123' } };
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });
      mockIsDevMode.mockReturnValue(false);

      const mockPoll = { id: 'poll-123', ...multipleVotesPollData };
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockPoll, error: null }),
        }),
      });
      mockSupabase.from.mockReturnValue({ insert: mockInsert } as any);

      const result = await createPoll(multipleVotesPollData);

      expect(result.success).toBe(true);
      expect(result.pollId).toBe('poll-123');
    });

    it('should handle network timeout during poll creation', async () => {
      const mockSession = { user: { id: 'user-123' } };
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });
      mockIsDevMode.mockReturnValue(false);

      // Mock network timeout
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockRejectedValue(new Error('Network timeout')),
        }),
      });
      mockSupabase.from.mockReturnValue({ insert: mockInsert } as any);

      const result = await createPoll(validPollData);

      expect(result.success).toBe(false);
      expect(result.errors).toEqual({
        root: { _errors: ['An unexpected error occurred. Please try again.'] },
      });
    });

    it('should handle session retrieval error', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Session error' },
      });
      mockIsDevMode.mockReturnValue(false);

      const result = await createPoll(validPollData);

      expect(result.success).toBe(false);
      expect(result.errors).toEqual({
        root: { _errors: ['You must be logged in to create a poll'] },
      });
    });

    it('should trim whitespace from poll title and options', async () => {
      const whitespaceData = {
        ...validPollData,
        title: '  Test Poll Title  ',
        options: [
          { text: '  Option 1  ' },
          { text: '  Option 2  ' },
        ],
      };

      const mockSession = { user: { id: 'user-123' } };
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });
      mockIsDevMode.mockReturnValue(false);

      const mockPoll = { id: 'poll-123', ...validPollData };
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockPoll, error: null }),
        }),
      });
      mockSupabase.from.mockReturnValue({ insert: mockInsert } as any);

      const result = await createPoll(whitespaceData);

      expect(result.success).toBe(true);
      // Verify that the insert was called with trimmed data
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Test Poll Title',
      }));
    });
  });

  describe('deletePoll', () => {
    const mockPollId = 'poll-123';
    const mockUserId = 'user-123';

    it('should delete a poll successfully', async () => {
      // Mock authenticated session
      const mockSession = { user: { id: mockUserId } };
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      // Mock poll ownership verification
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { user_id: mockUserId },
            error: null,
          }),
        }),
      });

      // Mock successful deletion
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'polls') {
          return { select: mockSelect, delete: mockDelete } as any;
        }
        return { delete: mockDelete } as any;
      });

      const result = await deletePoll(mockPollId);

      expect(result).toEqual({ success: true });
      expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard');
    });

    it('should fail when user is not authenticated', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const result = await deletePoll(mockPollId);

      expect(result).toEqual({
        success: false,
        error: 'You must be logged in to delete a poll',
      });
    });

    it('should fail when poll is not found', async () => {
      const mockSession = { user: { id: mockUserId } };
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Not found' },
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({ select: mockSelect } as any);

      const result = await deletePoll(mockPollId);

      expect(result).toEqual({
        success: false,
        error: 'Poll not found',
      });
    });

    it('should fail when user tries to delete someone else\'s poll', async () => {
      const mockSession = { user: { id: mockUserId } };
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { user_id: 'different-user-id' },
            error: null,
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({ select: mockSelect } as any);

      const result = await deletePoll(mockPollId);

      expect(result).toEqual({
        success: false,
        error: 'You can only delete your own polls',
      });
    });
  });

  describe('updatePoll', () => {
    const mockPollId = 'poll-123';
    const mockUserId = 'user-123';
    const validUpdateData: PollFormValues = {
      title: 'Updated Poll Title',
      description: 'This is an updated poll description that is long enough',
      isPublic: false,
      allowMultipleVotes: true,
      options: [
        { text: 'Updated Option 1' },
        { text: 'Updated Option 2' },
        { text: 'New Option 3' },
      ],
    };

    it('should update a poll successfully', async () => {
      // Mock authenticated session
      const mockSession = { user: { id: mockUserId } };
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      // Mock combined poll ownership verification query
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { user_id: mockUserId, title: 'Original Title' },
              error: null,
            }),
          }),
        }),
      });

      // Mock RPC call failure (function doesn't exist) to trigger fallback
      const mockRpc = jest.fn().mockResolvedValue({
        error: { code: '42883', message: 'Function does not exist' },
      });

      // Mock successful fallback operations
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });
      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'polls') {
          return { select: mockSelect, update: mockUpdate } as any;
        }
        return { delete: mockDelete, insert: mockInsert } as any;
      });
      mockSupabase.rpc = mockRpc;

      const result = await updatePoll(mockPollId, validUpdateData);

      expect(result).toEqual({
        success: true,
        pollId: mockPollId,
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard');
      expect(mockRevalidatePath).toHaveBeenCalledWith(`/polls/${mockPollId}`);
    });

    it('should fail with validation errors', async () => {
      const invalidUpdateData = {
        title: 'Hi', // Too short
        description: 'Short', // Too short
        isPublic: true,
        allowMultipleVotes: false,
        options: [{ text: 'Only one option' }], // Not enough options
      };

      const result = await updatePoll(mockPollId, invalidUpdateData as PollFormValues);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should fail when user is not authenticated', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const result = await updatePoll(mockPollId, validUpdateData);

      expect(result).toEqual({
        success: false,
        errors: { root: { _errors: ['You must be logged in to update a poll'] } },
      });
    });

    it('should fail when poll is not found', async () => {
      const mockSession = { user: { id: mockUserId } };
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'Not found' },
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({ select: mockSelect } as any);

      const result = await updatePoll(mockPollId, validUpdateData);

      expect(result).toEqual({
        success: false,
        errors: { root: { _errors: ['Poll not found or you do not have permission to edit it'] } },
      });
    });

    it('should fail when user tries to update someone else\'s poll', async () => {
      const mockSession = { user: { id: mockUserId } };
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      // Mock the combined query that filters by both poll_id and user_id
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null, // No data returned because user doesn't own the poll
              error: { code: 'PGRST116', message: 'Not found' },
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({ select: mockSelect } as any);

      const result = await updatePoll(mockPollId, validUpdateData);

      expect(result).toEqual({
        success: false,
        errors: { root: { _errors: ['Poll not found or you do not have permission to edit it'] } },
      });
    });
  });
});