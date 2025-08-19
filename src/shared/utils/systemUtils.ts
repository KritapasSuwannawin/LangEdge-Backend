export const logError = (location: string, error: unknown): void => {
  const errorMessage = error instanceof Error ? error.message : error instanceof String ? error : 'Unknown error';
  console.error(`${location}:`, errorMessage);
};
