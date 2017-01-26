/**
 * getIplayer
 */

/* Node modules */
import {exec, spawn} from "child_process";

/* Third-party modules */

/* Files */

const getIplayer = "get_iplayer";

export default class GetIplayer {

    refresh (force = false) {

        return new Promise((resolve, reject) => {

            const forceFlag = force ? "--force" : "";

            exec(`${getIplayer} --refresh ${forceFlag}`, (err, stdout, stderr) => {
                console.log(err);
                console.log(stdout);
                console.log(stderr);
                if (err) {
                    reject(err);
                    return;
                }

                console.log(stdout);
            });

        });

    }

    /**
     * Search
     *
     * Searches for a programme by type
     *
     * @param {string} search
     * @param {string} type
     * @returns {Promise}
     */
    search (search, type) {

        return new Promise((resolve, reject) => {

            if (!search) {
                resolve([]);
                return;
            }

            const cmd = spawn(getIplayer, [
                `--type=${type}`,
                "--nocopyright",
                search
            ]);

            let result = "";

            cmd.stdout.on("data", data => result += data);

            cmd
                .on("error", reject)
                .on("close", () => resolve(GetIplayer.parseOutput(result)));

        });

    }

    /**
     * Parse Output
     *
     * Parses the output into an array of
     * objects
     *
     * @param {string} output
     * @returns {object[]}
     */
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
