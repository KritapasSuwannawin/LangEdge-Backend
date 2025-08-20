export const logError = (location: string, error: unknown): void => {
  const errorMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown error';
  console.error(`${location}:`, errorMessage);
};
