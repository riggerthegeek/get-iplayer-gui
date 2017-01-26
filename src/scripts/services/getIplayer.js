/**
 * getIplayer
 */

/* Node modules */
import {exec, spawn} from "child_process";
import {EventEmitter} from "events";

/* Third-party modules */
import moment from "moment";
import {remote} from "electron";

/* Files */

const getIplayer = "get_iplayer";

export default class GetIplayer extends EventEmitter {

    download (pid) {

        const cwd = `${remote.app.getPath("temp")}/getIplayerGUI`;

        // @todo put in config
        const outputPath = "/home/semms/Dropbox/Media/Downloaded\ Radio/Unprocessed";

        return new Promise((resolve, reject) => {

            const cmd = spawn(getIplayer, [
                "--nocopyright",
                `--pid=${pid}`,
                "--subdir",
                `--output=${outputPath}`
            ], {
                cwd
            });

            let result = "";

            cmd.stdout.on("data", data => {
                const percent = GetIplayer.stringToPercent(data.toString());

                if (percent !== null) {
                    this.emit("downloadPercent", pid, percent);
                }

                result += data;
            });

            cmd
                .on("error", reject)
                .on("close", resolve);

        });

    }

    info (pid) {

        return new Promise((resolve, reject) => {

            exec(`${getIplayer} --nocopyright --pid=${pid} --info`, (err, stdout) => {

                if (err) {
                    reject(err);
                    return;
                }

                resolve(GetIplayer.stringToJson(stdout));

            });

        });

    }

    refresh (force = false) {

        return new Promise((resolve, reject) => {

            const forceFlag = force ? "--force" : "";

            exec(`${getIplayer} --nocopyright --refresh ${forceFlag}`, (err, stdout, stderr) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve();
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
                const regex = /^(\d+):\s+(.*)\s+-\s+(.*),\s+(.*),\s+(.*)$/;

                if (regex.test(line)) {
                    const match = line.match(regex);

                    const id = match[1];
                    const title = match[2];
                    const episode = match[3];
                    const channel = match[4];
                    const pid = match[5];

                    result.push({
                        id,
                        title,
                        episode,
                        channel,
                        pid
                    });
                }

                return result;
            }, []);
    }

    static stringToKeyValue (str) {
        const regex = /^([a-z]+):\s+(.*)/;

        if (regex.test(str)) {
            const match = str.match(regex);

            const key = match[1];
            let value = match[2];

            const num = Number(value);
            const date = moment(value, moment.ISO_8601);

            if (Number.isNaN(num) === false) {
                value = num;
            } else if (date.isValid()) {
                value = date.toDate();
            }

            return {
                key,
                value
            };
        }

        return {};
    }

    static stringToJson (str) {
        return str.split("\n")
            .reduce((result, line) => {
                const { key, value } = GetIplayer.stringToKeyValue(line);

                if (key) {
                    result[key] = value;
                }

                return result;
            }, {});
    }

    static stringToPercent (str) {
        const regex = /(\d+(\.\d+)?)%/;

        let percent = null;

        if (regex.test(str)) {
            const match = str.match(regex);

            percent = Number(match[1]);

            if (percent < 0) {
                percent = 0;
            } else if (percent > 100) {
                percent = 100;
            }
        }

        return percent;
    }

}
