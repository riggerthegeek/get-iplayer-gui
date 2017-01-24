/**
 * getIplayer
 */

/* Node modules */
import {exec} from "child_process";

/* Third-party modules */

/* Files */

export default class GetIplayer {

    search (search, type) {

        return new Promise((resolve, reject) => {

            exec(`get_iplayer --type=${type} --nocopyright ${search}`, (err, stdout) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve(GetIplayer.parseOutput(stdout));
            });

        });

    }

    static parseOutput (output) {
        return output.split("\n")
            .reduce((result, line) => {
                /* Only interested with the data that starts in a number and colon */
                const regex = /^(\d+):\s+(.*),\s+(.*),\s+(.*)$/;

                if (regex.test(line)) {
                    const match = line.match(regex);

                    const id = match[1];
                    const title = match[2];
                    const channel = match[3];
                    const pid = match[4];

                    result.push({
                        id,
                        title,
                        channel,
                        pid
                    });
                }

                return result;
            }, []);
    }

}
