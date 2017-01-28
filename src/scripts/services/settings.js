/**
 * settings
 */

/* Node modules */
import path from "path";

/* Third-party modules */
import {remote} from "electron";

/* Files */

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

        const settingsFile = path.join(remote.app.getPath("userData"), "getIplayerSettings.json");

        let settings;
        try {
            settings = require(settingsFile);
        } catch (err) {
            settings = {};
        }

        return settings[setting];

    }


}
