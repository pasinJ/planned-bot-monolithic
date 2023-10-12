export const toBeHttpErrorResponse = expect.objectContaining({
  error: {
    name: expect.toBeString(),
    type: expect.toBeString(),
    message: expect.toBeString(),
    causesList: expect.toBeArray(),
  },
});
