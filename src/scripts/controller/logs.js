/**
 * logs
 */

/* Node modules */
import fs from "fs";

/* Third-party modules */

/* Files */

export default function (logger, logs, $uibModalInstance) {

    this.delete = () => new Promise((resolve, reject) => {
        if (confirm("Are you sure?")) {
            fs.unlink(logger.findLogPath(), err => {
                if (err && err.code !== "ENOENT") {
                    reject(err);
                    return;
                }

                resolve();
            });
        } else {
            resolve();
        }
    }).then(() => this.ok());

    this.logs = logs;

    this.ok = $uibModalInstance.close;

}
