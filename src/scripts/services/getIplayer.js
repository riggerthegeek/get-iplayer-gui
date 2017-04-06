/**
 * getIplayer
 */

/* Node modules */
import {exec, spawn} from "child_process";
import {EventEmitter} from "events";
import fs from "fs";
import path from "path";

/* Third-party modules */
import {_} from "lodash";
import moment from "moment";
import {remote} from "electron";

/* Files */

const getIplayer = "get_iplayer";

export default class GetIplayer extends EventEmitter {

    get types () {
        return {
            // liveradio: "Live Radio",
            // livetv: "Live TV",
            // localfiles: "Local Files",
            // podcast: "Podcast",
            radio: "Radio",
            tv: "TV"
        };
    }

    constructor (logger, settings) {
        super();

        this._downloads = [];
        this._logger = logger;
        this._settings = settings;

        this.on("STOP_DOWNLOADS", () => this._removeDownload());
    }

    _addDownload (cmd) {
        this._downloads.push(cmd);
    }

    _removeDownload (cmd = null) {
        if (cmd) {
            cmd.kill("SIGINT");

            const index = this._downloads.indexOf(cmd);
            this._downloads.splice(index, 1);

            this._logger.info(`Download stopped. PID: ${cmd.pid}`);
        } else {
            this._downloads.forEach(prg => this._removeDownload(prg));
        }
    }

    _spawn (args) {
        this._logger.info("New command spawned", getIplayer, args);
        return spawn(getIplayer, args);
    }

    cache (pid) {

        const history = path.join(remote.app.getPath("home"), ".get_iplayer", "download_history");

        return new Promise((resolve, reject) => {

            fs.readFile(history, "utf8", (err, file) => {

                if (err && err.code !== "ENOENT") {
                    this._logger.error(err);
                    reject(err);
                    return;
                }

                const regex = new RegExp(`${pid}\\\|`);

                resolve(regex.test(file));

            });

        });

    }

    download (pid) {

        return this.cache(pid)
            .then(downloaded => {

                if (downloaded) {
                    this.emit("FILE_IN_CACHE", pid);
                    return;
                }

                const outputPath = this._settings.downloadDir;

                return new Promise((resolve, reject) => {

                    const cmd = this._spawn([
                        "--nocopyright",
                        `--pid=${pid}`,
                        "--subdir",
                        "--whitespace",
                        `--output=${outputPath}`
                    ]);

                    this._addDownload(cmd);

                    let currentPercent = null;

                    cmd.stdout.on("data", data => {

                        const percent = GetIplayer.stringToPercent(data.toString());

                        if (percent !== null) {
                            this.emit("DOWNLOAD_PERCENT", pid, percent);

                            currentPercent = percent;
                        }
                    });

                    cmd
                        .on("error", err => {
                            this._removeDownload(cmd);

                            this._logger.error(err);
                            reject(err);
                        })
                        .on("close", () => {
                            this._removeDownload(cmd);

                            if (currentPercent === null) {
                                this.emit("CANNOT_FIND_PID", pid);
                            } else {
                                this.emit("DOWNLOAD_COMPLETE", pid);
                            }

                            resolve(pid);
                        });

                });
            });

    }

    info (pid) {

        return new Promise((resolve, reject) => {

            const cmd = `${getIplayer} --nocopyright --pid=${pid} --info`;

            this._logger.info("New command executed", cmd);

            exec(cmd, (err, stdout) => {

                if (err) {
                    this._logger.error(err);
                    reject(err);
                    return;
                }

                resolve(GetIplayer.stringToJson(stdout));

            });

        });

    }

    refresh (force = false) {

        const dir = path.join(remote.app.getPath("home"), ".get_iplayer");

        const tasks = Object.keys(this.types).reduce((result, type) => {

            const file = path.join(dir, `${type}.cache`);

            const task = new Promise((resolve, reject) => {

                if (force) {
                    return resolve({
                        type,
                        update: true
                    });
                }

                fs.stat(file, (err, stat) => {

                    if (err && err.code !== "ENOENT") {
                        this._logger.error(err);
                        reject(err);
                        return;
                    }

                    let update = true;

                    if (_.has(stat, "mtime")) {

                        const modTime = stat.mtime;

                        if ((Date.now() - modTime.getTime()) < this._settings.cacheAge) {
                            update = false;
                        }

                    }

                    resolve({
                        type,
                        update
                    });

                });

            });

            result.push(task);

            return result;

        }, []);

        return Promise.all(tasks)
            .then(result => {

                const types = result.reduce((result, { type, update }) => {

                    if (update) {
                        result.push(type);
                    }

                    return result;

                }, []);

                if (types.length === 0) {
                    /* Nothing to update */
                    return;
                }

                const forceFlag = force ? "--force" : "";

                return new Promise((resolve, reject) => {

                    this.emit("CACHE_REFRESH_START");

                    const cmd = this._spawn([
                        "--nocopyright",
                        "--refresh",
                        "--nopurge",
                        `--type=${types.join(",")}`,
                        forceFlag
                    ]);

                    let result = "";

                    /* Weirdly, seems to need this */
                    cmd.stdout.on("data", data => result += data);

                    cmd
                        .on("error", err => {
                            this._logger.error(err);
                            reject(err);
                        })
                        .on("close", () => {
                            this.emit("CACHE_REFRESH_END");

                            resolve(result);
                        });

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

            const cmd = this._spawn([
                `--type=${typesStr}`,
                "--nocopyright",
                search
            ]);

            let result = "";

            cmd.stdout.on("data", data => result += data);

            cmd
                .on("error", err => {
                    this._logger.error(err);
                    reject(err);
                })
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
