type LogMetadataValue = boolean | number | string | null | undefined;

type LogMetadata = Record<string, LogMetadataValue>;

const formatMetadata = (metadata?: LogMetadata): string => {
  if (!metadata) {
    return '';
  }

  const sanitizedMetadata = Object.entries(metadata).reduce<Record<string, LogMetadataValue>>((accumulator, [key, value]) => {
    if (value !== undefined) {
      accumulator[key] = value;
    }

    return accumulator;
  }, {});

  if (Object.keys(sanitizedMetadata).length === 0) {
    return '';
  }

  return ` ${JSON.stringify(sanitizedMetadata)}`;
};

const formatLogMessage = (context: string, message: string, metadata?: LogMetadata): string => {
  return `${context}: ${message}${formatMetadata(metadata)}`;
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Unknown error';
};

export const logInfo = (context: string, message: string, metadata?: LogMetadata): void => {
  console.info(formatLogMessage(context, message, metadata));
};

export const logWarn = (context: string, message: string, metadata?: LogMetadata): void => {
  console.warn(formatLogMessage(context, message, metadata));
};

export const logError = (context: string, error: unknown, metadata?: LogMetadata): void => {
  console.error(formatLogMessage(context, getErrorMessage(error), metadata));
};
