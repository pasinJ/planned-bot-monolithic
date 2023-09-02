export const toBeHttpErrorResponse = expect.objectContaining({
  error: {
    name: expect.toBeString(),
    message: expect.toBeString(),
    causes: expect.toBeArray(),
  },
});
