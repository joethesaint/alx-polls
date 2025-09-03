export const supabase = {
  auth: {
    getSession: jest.fn(() => Promise.resolve({ data: { session: null } })),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({})),
    insert: jest.fn(() => ({})),
    update: jest.fn(() => ({})),
    delete: jest.fn(() => ({})),
  })),
};
