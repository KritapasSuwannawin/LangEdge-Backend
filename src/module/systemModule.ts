export const convertQueryFieldToObject = (queryField: string | undefined): boolean | number | string | undefined => {
  if (queryField === undefined) {
    return undefined;
  }

  if (queryField === 'true') {
    return true;
  }

  if (queryField === 'false') {
    return false;
  }

  // check if queryField contains only numbers
  if (/^\d+$/.test(queryField)) {
    return Number(queryField);
  }

  return queryField;
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
