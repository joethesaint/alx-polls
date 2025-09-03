import { submitVote, getPollResults } from '../../lib/vote-actions';
import { getCurrentUser } from '../../lib/auth-helpers';
import { getPollById, submitPollVote, getPollResults as getPollResultsFromDB } from '../../lib/poll-operations';
import { revalidatePath } from 'next/cache';

// Mock auth helpers
jest.mock('../../lib/auth-helpers', () => ({
  getCurrentUser: jest.fn(),
  validateVotingPermissions: jest.fn(),
}));

// Mock poll operations
jest.mock('../../lib/poll-operations', () => ({
  getPollById: jest.fn(),
  submitPollVote: jest.fn(),
  getPollResults: jest.fn(),
}));

// Mock revalidatePath
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

// Mock validation helpers
jest.mock('../../lib/validation-helpers', () => ({
  validateVoteData: jest.fn(),
  validatePollId: jest.fn(),
}));

// Mock functions
const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>;
const mockGetPollById = getPollById as jest.MockedFunction<typeof getPollById>;
const mockSubmitPollVote = submitPollVote as jest.MockedFunction<typeof submitPollVote>;
const mockGetPollResultsFromDB = getPollResultsFromDB as jest.MockedFunction<typeof getPollResultsFromDB>;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>;

// Import validation helpers for mocking
import { validateVoteData, validatePollId } from '../../lib/validation-helpers';
const mockValidateVoteData = validateVoteData as jest.MockedFunction<typeof validateVoteData>;
const mockValidatePollId = validatePollId as jest.MockedFunction<typeof validatePollId>;

// Import auth helpers for mocking
import { validateVotingPermissions } from '../../lib/auth-helpers';
const mockValidateVotingPermissions = validateVotingPermissions as jest.MockedFunction<typeof validateVotingPermissions>;

describe('Vote Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.error to prevent error messages in test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Setup default successful mocks
    mockValidateVoteData.mockReturnValue({ success: true, data: { pollId: 'poll-123', optionId: 'option-456' } });
    mockValidatePollId.mockReturnValue({ success: true, data: 'poll-123' });
    mockValidateVotingPermissions.mockResolvedValue({ success: true });
    mockGetPollById.mockResolvedValue({ success: true, data: { id: 'poll-123', allow_multiple_votes: false } as any });
    mockSubmitPollVote.mockResolvedValue({ success: true });
    mockGetPollResultsFromDB.mockResolvedValue({ success: true, data: { id: 'poll-123' } as any });
  });

  afterEach(() => {
    // Restore console.error
    jest.restoreAllMocks();
  });

  describe('submitVote', () => {
    const validVoteData = {
      pollId: 'poll-123',
      optionId: 'option-456',
    };

    it('should successfully submit vote for authenticated user', async () => {
      // Mock authenticated user
      mockGetCurrentUser.mockResolvedValue({ id: 'user-123', email: 'test@example.com' });

      const result = await submitVote(validVoteData);

      expect(result.success).toBe(true);
      expect(mockValidateVoteData).toHaveBeenCalledWith(validVoteData);
      expect(mockGetCurrentUser).toHaveBeenCalled();
      expect(mockGetPollById).toHaveBeenCalledWith('poll-123');
      expect(mockValidateVotingPermissions).toHaveBeenCalledWith('poll-123', 'user-123', false);
      expect(mockSubmitPollVote).toHaveBeenCalledWith('poll-123', 'option-456', 'user-123', undefined);
      expect(mockRevalidatePath).toHaveBeenCalledWith('/polls/poll-123');
    });

    it('should successfully submit vote for anonymous user', async () => {
      // Mock anonymous user (no session)
      mockGetCurrentUser.mockResolvedValue(null);
      
      // Mock poll that allows multiple votes
      mockGetPollById.mockResolvedValue({ success: true, data: { id: 'poll-123', allow_multiple_votes: true } as any });

      const result = await submitVote(validVoteData);

      expect(result.success).toBe(true);
      expect(mockValidateVoteData).toHaveBeenCalledWith(validVoteData);
      expect(mockGetCurrentUser).toHaveBeenCalled();
      expect(mockGetPollById).toHaveBeenCalledWith('poll-123');
      expect(mockValidateVotingPermissions).toHaveBeenCalledWith('poll-123', null, true);
      expect(mockSubmitPollVote).toHaveBeenCalledWith('poll-123', 'option-456', undefined, 'anonymous-ip-placeholder');
      expect(mockRevalidatePath).toHaveBeenCalledWith('/polls/poll-123');
    });

    it('should prevent duplicate votes when multiple votes not allowed', async () => {
      // Mock authenticated user
      mockGetCurrentUser.mockResolvedValue({ id: 'user-123', email: 'test@example.com' });
      
      // Mock voting permission validation failure
      mockValidateVotingPermissions.mockResolvedValue({
        success: false,
        errors: { root: { _errors: ['You have already voted on this poll'] } }
      });

      const result = await submitVote(validVoteData);

      expect(result).toEqual({
        success: false,
        errors: { root: { _errors: ['You have already voted on this poll'] } },
      });
      expect(mockValidateVotingPermissions).toHaveBeenCalledWith('poll-123', 'user-123', false);
    });

    it('should fail with validation errors for invalid UUID', async () => {
      const invalidVoteData = {
        pollId: 'invalid-uuid',
        optionId: 'also-invalid-uuid',
      };

      // Mock validation failure
      mockValidateVoteData.mockReturnValue({
        success: false,
        errors: { pollId: { _errors: ['Invalid UUID'] }, optionId: { _errors: ['Invalid UUID'] } }
      });

      const result = await submitVote(invalidVoteData);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(mockValidateVoteData).toHaveBeenCalledWith(invalidVoteData);
    });

    it('should fail when poll is not found', async () => {
      // Mock authenticated user
      mockGetCurrentUser.mockResolvedValue({ id: 'user-123', email: 'test@example.com' });
      
      // Mock poll not found
      mockGetPollById.mockResolvedValue({
        success: false,
        errors: { root: { _errors: ['Poll not found'] } }
      });

      const result = await submitVote(validVoteData);

      expect(result).toEqual({
        success: false,
        errors: { root: { _errors: ['Poll not found'] } },
      });
      expect(mockGetPollById).toHaveBeenCalledWith('poll-123');
    });

    it('should fail when vote insertion fails', async () => {
      // Mock authenticated user
      mockGetCurrentUser.mockResolvedValue({ id: 'user-123', email: 'test@example.com' });
      
      // Mock database error on vote submission
      mockSubmitPollVote.mockResolvedValue({
        success: false,
        errors: { root: { _errors: ['Failed to submit vote. Please try again.'] } }
      });

      const result = await submitVote(validVoteData);

      expect(result).toEqual({
        success: false,
        errors: { root: { _errors: ['Failed to submit vote. Please try again.'] } },
      });
      expect(mockSubmitPollVote).toHaveBeenCalledWith('poll-123', 'option-456', 'user-123', undefined);
    });

    it('should allow multiple votes when poll allows it', async () => {
      // Mock authenticated user
      mockGetCurrentUser.mockResolvedValue({ id: 'user-123', email: 'test@example.com' });
      
      // Mock poll that allows multiple votes
      mockGetPollById.mockResolvedValue({ success: true, data: { id: 'poll-123', allow_multiple_votes: true } as any });

      const result = await submitVote(validVoteData);

      expect(result).toEqual({ success: true });
      expect(mockValidateVotingPermissions).toHaveBeenCalledWith('poll-123', 'user-123', true);
      expect(mockSubmitPollVote).toHaveBeenCalledWith('poll-123', 'option-456', 'user-123', undefined);
      expect(mockRevalidatePath).toHaveBeenCalledWith('/polls/poll-123');
    });
  });

  describe('getPollResults', () => {
    const mockPollId = 'poll-123';

    it('should return poll results successfully', async () => {
      const mockPollData = {
        id: mockPollId,
        title: 'Test Poll',
        poll_options: [
          { id: 'option-1', option_text: 'Option 1' },
          { id: 'option-2', option_text: 'Option 2' },
        ],
      };

      // Mock validation success
      mockValidatePollId.mockReturnValue({ success: true, data: mockPollId });
      mockGetPollResultsFromDB.mockResolvedValue({ success: true, data: mockPollData as any });
      
      const result = await getPollResults(mockPollId);

      expect(result).toEqual({
        success: true,
        data: mockPollData,
      });
      expect(mockValidatePollId).toHaveBeenCalledWith(mockPollId);
      expect(mockGetPollResultsFromDB).toHaveBeenCalledWith(mockPollId);
    });

    it('should fail when poll is not found', async () => {
      // Mock validation success but poll not found
      mockValidatePollId.mockReturnValue({ success: true, data: mockPollId });
      mockGetPollResultsFromDB.mockResolvedValue({
        success: false,
        errors: { root: { _errors: ['Poll not found'] } }
      });

      const result = await getPollResults(mockPollId);

      expect(result).toEqual({
        success: false,
        errors: { root: { _errors: ['Poll not found'] } },
      });
      expect(mockGetPollResultsFromDB).toHaveBeenCalledWith(mockPollId);
    });

    it('should handle validation errors for invalid poll ID', async () => {
      const invalidPollId = 'invalid-uuid';
      
      // Mock validation failure
      mockValidatePollId.mockReturnValue({
        success: false,
        errors: { root: { _errors: ['Invalid poll ID format'] } }
      });

      const result = await getPollResults(invalidPollId);

      expect(result).toEqual({
        success: false,
        errors: { root: { _errors: ['Invalid poll ID format'] } },
      });
      expect(mockValidatePollId).toHaveBeenCalledWith(invalidPollId);
    });
  });
});