export function setEnvVar(varName: string, value: string | undefined) {
  return () => {
    jest.resetModules();
    process.env = { ...process.env, [varName]: value };
  };
}

export function resetEnvVar(originalEnv: NodeJS.ProcessEnv) {
  return () => {
    process.env = originalEnv;
  };
}
