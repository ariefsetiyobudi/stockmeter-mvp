import winston from 'winston';

/**
 * Create a Winston logger instance with consistent formatting
 * @param context Optional context label for the logger
 */
export const createLogger = (context?: string) => {
  const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, context: ctx, ...meta }) => {
      const contextLabel = ctx || context || 'App';
      const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
      return `${timestamp} [${level.toUpperCase()}] [${contextLabel}]: ${message} ${metaStr}`;
    })
  );

  return winston.createLogger({
    level: process.env['LOG_LEVEL'] || 'info',
    format,
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          format
        ),
      }),
    ],
  });
};

// Default logger instance
export const logger = createLogger();

export default logger;
