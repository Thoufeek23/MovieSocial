// Lightweight logger wrapper to centralize log output and allow runtime control
// via environment variables. Keeps console as the backend to avoid new deps.
const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

const envLevel = (process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')).toLowerCase();
const currentLevel = LEVELS[envLevel] !== undefined ? LEVELS[envLevel] : LEVELS.info;

function format(prefix, args) {
  const ts = new Date().toISOString();
  return [`[${ts}] [${prefix}]`, ...args];
}

module.exports = {
  error: (...args) => {
    if (currentLevel >= LEVELS.error) {
      console.error(...format('ERROR', args));
    }
  },
  warn: (...args) => {
    if (currentLevel >= LEVELS.warn) {
      console.warn(...format('WARN', args));
    }
  },
  info: (...args) => {
    if (currentLevel >= LEVELS.info) {
      console.log(...format('INFO', args));
    }
  },
  debug: (...args) => {
    if (currentLevel >= LEVELS.debug) {
      console.debug(...format('DEBUG', args));
    }
  },
};
