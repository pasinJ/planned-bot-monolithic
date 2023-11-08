export const toBeHttpErrorResponse = expect.objectContaining({
  error: expect.objectContaining({
    name: expect.toBeString(),
    type: expect.toBeString(),
    message: expect.toBeString(),
    causesList: expect.toBeArray(),
  }),
});
