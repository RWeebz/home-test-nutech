import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceDir = path.resolve(__dirname, '..');

const { combine, timestamp, printf, colorize, align, uncolorize } = winston.format;

// Custom format similar to Rust's tracing
const tracingFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let meta = '';
  if (Object.keys(metadata).length > 0) {
    meta = ` ${JSON.stringify(metadata)}`;
  }
  return `${timestamp} [${level.toUpperCase()}]: ${message}${meta}`;
});

// Custom format for file (without colors)
const fileFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  align(),
  tracingFormat
);

// Console format (same as file format for now)
const consoleFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  align(),
  tracingFormat
);

// Daily rotate file transport
const dailyRotateFileTransport = new DailyRotateFile({
  dirname: path.join(workspaceDir, 'logs'),
  filename: 'application-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: fileFormat
});

// Create the logger instance
const logger = winston.createLogger({
  level: (process.env.LOG_LEVEL || 'info').toLowerCase(),
  transports: [
    new winston.transports.Console({
      format: consoleFormat
    }),
    dailyRotateFileTransport
  ]
});

// Create a stream object for morgan
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

export default logger;
