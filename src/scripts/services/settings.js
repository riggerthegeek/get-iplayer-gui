/**
 * settings
 */

/* Node modules */
import fs from "fs";
import path from "path";

/* Third-party modules */
import {remote} from "electron";

/* Files */

const settingsFile = path.join(remote.app.getPath("userData"), "getIplayerSettings.json");

export default class Settings {

    get cacheAge () {
        return 4 * 60 * 60 * 1000;
    }

    get downloadDir () {
        return this.getSetting("downloadDir") || path.join(remote.app.getPath("music"), "getIplayer");
    }

    getAll () {
        return {
            downloadDir: this.downloadDir
        }
    }

    getSetting (setting) {

        let settings;
        try {
            /* Use read file so it never caches the file like require */
            settings = JSON.parse(fs.readFileSync(settingsFile, "utf8"));
        } catch (err) {
            settings = {};
        }

        console.log(settings);

        return settings[setting];

    }

    save (data = {}) {

        const settings = JSON.stringify(data, null, 2);

        return new Promise((resolve, reject) => {

            fs.writeFile(settingsFile, settings, "utf8", err => {

                if (err) {
                    reject(err);
                    return;
                }

                resolve();

            });

        });

    }


}
