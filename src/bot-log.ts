import { createLogger, format, transports } from 'winston';

const logger = createLogger();
if (process.env.NODE_ENV !== 'production') {
    logger.add(new transports.Console({
      format: format.simple(),
    }));
  }

/** logger specific for the bot */
export function botLog() {
    return logger;
}
