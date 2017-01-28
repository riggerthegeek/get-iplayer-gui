/**
 * Main
 *
 * This controls the window process and the
 * instantiation of the application.
 */

/* Node modules */

/* Third-party modules */
import {app, BrowserWindow, shell} from "electron";
import {data as datatypes} from "datautils";

/* Files */
import pkg from "../package.json";

/*
    Keep a global reference of the window, so it's
    not closed during garbage collection.
 */
let mainWindow;

function createWindow () {

    mainWindow = new BrowserWindow({
        minimizable: false,
        maximizable: false,
        maxHeight: 800,
        maxWidth: 1000,
        minHeight: 600,
        minWidth: 800,
        title: pkg.name,
        height: 800,
        width: 1000
    });

    const {webContents} = mainWindow;

    if (datatypes.setBool(process.env.SHOW_DEV_TOOLS, false)) {
        webContents.openDevTools();
    }

    mainWindow.loadURL(`file://${__dirname}/index.html`);

    mainWindow.on("closed", () => mainWindow = null);

    const handleRedirect = (event, url) => {
        if (url !== webContents.getURL()) {
            event.preventDefault();
            shell.openExternal(url);
        }
    };

    webContents
        .on("new-window", handleRedirect)
        .on("will-navigate", handleRedirect);

}

app
    .on("activate", () => mainWindow === null ? createWindow() : "")
    .on("ready", createWindow)
    .on("window-all-closed", () => app.quit());

export { app };
