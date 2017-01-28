/**
 * getIplayer
 */

/* Node modules */
import {exec, spawn} from "child_process";
import {EventEmitter} from "events";

/* Third-party modules */
import moment from "moment";
// import { remote } from "electron";

/* Files */

const getIplayer = "get_iplayer";

export default class GetIplayer extends EventEmitter {

    download (pid) {

        // @todo put in config
        const outputPath = "/tmp/home/semms/Dropbox/Media/Downloaded\ Radio/Unprocessed";

        return new Promise((resolve, reject) => {

            const cmd = spawn(getIplayer, [
                "--nocopyright",
                `--pid=${pid}`,
                "--subdir",
                `--output=${outputPath}`
            ]);

            cmd.stdout.on("data", data => {
                const percent = GetIplayer.stringToPercent(data.toString());

                if (percent !== null) {
                    this.emit("downloadPercent", pid, percent);
                }
            });

            cmd
                .on("error", reject)
                .on("close", () => {
                    this.emit("downloadComplete", pid);

                    resolve(pid);
                });

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

            exec(`${getIplayer} --nocopyright --refresh ${forceFlag}`, (err) => {
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
     * Searches for a programme by type(s)
     *
     * @param {string} search
     * @param {string[]} types
     * @returns {Promise}
     */
    search (search, types) {

        return new Promise((resolve, reject) => {

            if (!search) {
                resolve([]);
                return;
            }

            const typesStr = types.join(",");

            const cmd = spawn(getIplayer, [
                `--type=${typesStr}`,
                "--nocopyright",
                search
            ]);

            let result = "";

            cmd.stdout.on("data", data => result += data);

            cmd
                .on("error", reject)
                .on("close", () => resolve(GetIplayer.parseOutput(result, typesStr)));

        });

    }

    /**
     * Parse Output
     *
     * Parses the output into an array of
     * objects
     *
     * @param {string} output
     * @param {string} type
     * @returns {object[]}
     */
    static parseOutput (output, types) {
        return output.split("\n")
            .reduce((result, line) => {
                /* Only interested with the data that starts in a number and colon */
                const regexNoType = /^(\d+):\s+(.*)\s+-\s+(.*),\s+(.*),\s+(.*)$/;
                const regexType = /^(\d+):\s+(.*),\s+(.*)\s+-\s+(.*),\s+(.*),\s+(.*)$/;

                if (regexType.test(line)) {
                    const match = line.match(regexType);

                    const id = match[1];
                    const type = match[2];
                    const title = match[3];
                    const episode = match[4];
                    const channel = match[5];
                    const pid = match[6];

                    result.push({
                        channel,
                        episode,
                        id,
                        pid,
                        title,
                        type
                    });
                } else if (regexNoType.test(line)) {
                    const match = line.match(regexNoType);

                    const id = match[1];
                    const title = match[2];
                    const episode = match[3];
                    const channel = match[4];
                    const pid = match[5];

                    result.push({
                        channel,
                        episode,
                        id,
                        pid,
                        title,
                        type: types /* Single type */
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
