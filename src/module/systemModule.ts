export const parseQueryValue = (queryValue: string): undefined | boolean | number | string => {
  const trimmedQueryValue = queryValue.trim();

  // empty string -> undefined
  if (!trimmedQueryValue) {
    return undefined;
  }

  // boolean
  if (trimmedQueryValue.toLowerCase() === 'true') {
    return true;
  }

  // boolean
  if (trimmedQueryValue.toLowerCase() === 'false') {
    return false;
  }

  const numberedQueryValue = Number(trimmedQueryValue);

  // !NaN -> number
  if (!Number.isNaN(numberedQueryValue)) {
    return numberedQueryValue;
  }

  // string
  return trimmedQueryValue;
};

export const parseQuery = (query: Record<string, string>): Record<string, undefined | boolean | number | string> => {
  const parsedQuery: Record<string, undefined | boolean | number | string> = {};

  for (const [key, value] of Object.entries(query)) {
    parsedQuery[key] = parseQueryValue(value);
  }

  return parsedQuery;
};

export const isDefined = (value: unknown, isAllowNull = true): boolean => {
  if (value === undefined) {
    return false;
  }

  if (!isAllowNull && value === null) {
    return false;
  }

  return true;
};

export const logError = (location: string, err: unknown): void => {
  const errorMessage = err instanceof Error ? err.message : 'Unknown error';
  console.error(`${location}:`, errorMessage);
};
