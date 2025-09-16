/**
 * Centralized debug logging utility
 * Controls debug output throughout the application
 */

// Global debug logging configuration
let DEBUG_LOGGING_ENABLED = __DEV__ || false;
let LOG_LEVEL = 'ERROR'; // levels: 'ERROR', 'WARN', 'INFO', 'DEBUG', 'VERBOSE'

// Log level hierarchy (higher number = more verbose)
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  VERBOSE: 4
};

/**
 * Set the global debug logging state
 * @param {boolean} enabled - Whether to enable debug logging
 */
export const setDebugLogging = (enabled) => {
  DEBUG_LOGGING_ENABLED = enabled;
};

/**
 * Get the current debug logging state
 * @returns {boolean} Current debug logging state
 */
export const isDebugLoggingEnabled = () => {
  return DEBUG_LOGGING_ENABLED;
};

/**
 * Set the log level
 * @param {string} level - Log level ('ERROR', 'WARN', 'INFO', 'DEBUG', 'VERBOSE')
 */
export const setLogLevel = (level) => {
  if (LOG_LEVELS.hasOwnProperty(level)) {
    LOG_LEVEL = level;
  }
};

/**
 * Get the current log level
 * @returns {string} Current log level
 */
export const getLogLevel = () => {
  return LOG_LEVEL;
};

/**
 * Check if a message should be logged based on current log level
 * @param {string} messageLevel - The level of the message
 * @returns {boolean} Whether the message should be logged
 */
const shouldLog = (messageLevel) => {
  return LOG_LEVELS[messageLevel] <= LOG_LEVELS[LOG_LEVEL];
};

/**
 * Format log message with timestamp and level
 * @param {string} level - Log level
 * @param {string} module - Module/service name
 * @param {*} message - Log message
 * @returns {string} Formatted message
 */
const formatMessage = (level, module, message) => {
  const timestamp = new Date().toISOString().substring(11, 23); // HH:mm:ss.SSS
  return `[${timestamp}] ${level} [${module}]:`;
};

/**
 * Debug logger class for specific modules
 */
class ModuleLogger {
  constructor(moduleName) {
    this.moduleName = moduleName;
  }

  error(message, ...args) {
    if (shouldLog('ERROR')) {
      console.error(formatMessage('ERROR', this.moduleName, message), message, ...args);
    }
  }

  warn(message, ...args) {
    if (shouldLog('WARN')) {
      console.warn(formatMessage('WARN', this.moduleName, message), message, ...args);
    }
  }

  info(message, ...args) {
    if (DEBUG_LOGGING_ENABLED && shouldLog('INFO')) {
      console.log(formatMessage('INFO', this.moduleName, message), message, ...args);
    }
  }

  debug(message, ...args) {
    if (DEBUG_LOGGING_ENABLED && shouldLog('DEBUG')) {
      console.log(formatMessage('DEBUG', this.moduleName, message), message, ...args);
    }
  }

  verbose(message, ...args) {
    if (DEBUG_LOGGING_ENABLED && shouldLog('VERBOSE')) {
      console.log(formatMessage('VERBOSE', this.moduleName, message), message, ...args);
    }
  }

  // Always log - for critical user actions
  userAction(action, ...args) {
    console.log(`[USER] ${action}`, ...args);
  }
}

/**
 * Create a logger for a specific module
 * @param {string} moduleName - Name of the module
 * @returns {ModuleLogger} Logger instance for the module
 */
export const createLogger = (moduleName) => {
  return new ModuleLogger(moduleName);
};

// Export default logger
export const logger = createLogger('App');

// Convenience methods for global logging
export const debugLog = {
  error: (message, ...args) => logger.error(message, ...args),
  warn: (message, ...args) => logger.warn(message, ...args),
  info: (message, ...args) => logger.info(message, ...args),
  debug: (message, ...args) => logger.debug(message, ...args),
  verbose: (message, ...args) => logger.verbose(message, ...args),
  userAction: (action, ...args) => logger.userAction(action, ...args)
};
