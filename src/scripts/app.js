/**
 * NodeDB
 *
 * This configures our base Angular application. It
 * doesn't really do much aside from bootstrapping
 * the app and putting everything into Angular.
 *
 * In here should live things like view files,
 * configuration and the like. Anything more complex
 * should be spun off into it's own module
 */

/* Handle uncaught browser exceptions - put at the top to catch import errors */
process.on("uncaughtException", err => {
    console.error(err); // eslint-disable-line no-console
    alert(`Uncaught exception: ${err.stack}`);
});

/* Node modules */

/* Third-party modules */
import angular from "angular";
import "angular-hotkeys";
import "angular-sanitize";
import "angular-ui-router";
import "angular-ui-router.statehelper";
import "ng-page-title";

/* Files */

import configRoute from "./config/routes";

import controllerDownload from "./controller/download";

/* Create an empty template module - any cached templates will live in here */
angular.module("templates.get-iplayer-gui", []);

/* Get the local modules */
const modules = [
    "ngPageTitle",
    "ngSanitize",
    "templates.get-iplayer-gui",
    "ui.router",
    "ui.router.stateHelper"
];

/* Instantiate the Angular app */
const app = angular.module("get-iplayer-gui", modules);

/**
 * File Registration
 */

/*! Configs */
app.config(configRoute);

/*! Constants */

/*! Controllers */
app.controller("DownloadCtrl", controllerDownload);

/*! Directives */

/*! Factories */

/*! Filters */

/*! Providers */

/*! Services */

/*! Values */

/*! Run */

export { app };
