/**
 * logger
 */

/* Node modules */

/* Third-party modules */
import log from "electron-log";

/* Files */

log.transports.file.level = "info";

export default () => log;
