/**
 * download
 */

/* Node modules */
import fs from "fs";

/* Third-party modules */
import { _ } from "lodash";

/* Files */

export default [
    "getIplayer",
    "logger",
    "$scope",
    "settings",
    "$timeout",
    "$uibModal",
    function (getIplayer, logger, $scope, settings, $timeout, $uibModal) {

        getIplayer
            .on("CACHE_REFRESH_START", () => {
                logger.log("Cache update started");
                this.running = true;

                $scope.$apply();
            })
            .on("CACHE_REFRESH_END", () => {
                logger.log("Cache update finishes");
                this.running = false;

                $scope.$apply();
            })
            .on("CANNOT_FIND_PID", pid => {
                logger.log(`Cannot find ${pid}`);

                this.cannotFind.push(pid);

                $scope.$apply();
            })
            .on("DOWNLOAD_PERCENT", (pid, percent) => {
                logger.silly(`Download percent ${pid}`);
                this.queuePercent[pid] = percent;

                $scope.$apply();
            })
            .on("DOWNLOAD_COMPLETE", pid => {
                logger.log(`Download completed ${pid}`);
                this.queuePercent[pid] = 100;
            })
            .on("FILE_IN_CACHE", pid => {
                this.queue = this.queue.map(queue => {
                    if (queue.pid === pid) {
                        queue.complete = true;
                    }

                    return queue;
                });

                // @todo display message
                logger.log(`${pid} in cache`);

                this.fileCache.push(pid);
                $scope.$apply();
            });

        this.addToQueue = prog => {
            const repeat = this.queue.filter(({ pid }) => prog.pid === pid);

            if (repeat.length === 0) {
                this.queuePercent[prog.pid] = 0;

                this.queue.push(prog);
            }
        };

        this.addPID = () => {
            if (this.pid) {
                this.addToQueue({
                    pid: this.pid
                });
            }

            this.pid = "";
        };

        this.allTypes = getIplayer.types;

        this.cannotFind = [];

        this.download = () => {
            const concurrentDownloads = 5;

            const tasks = this.queue.reduce((result, { pid, complete }) => {
                if (result.length < concurrentDownloads && !complete) {
                    result.push(getIplayer.download(pid));
                }

                return result;
            }, []);

            if (tasks.length === 0) {
                /* All downloads complete */
                logger.log("all complete");
            } else {
                return Promise.all(tasks)
                    .then(result => {
                        this.queue = this.queue.map(queue => {
                            if (result.includes(queue.pid)) {
                                queue.complete = true;
                            }

                            return queue;
                        });

                        return this.download();
                    })
                    .catch(logger.error);
            }
        };

        this.fileCache = [];

        this.getInfo = prog => getIplayer.info(prog.pid)
            .then(result => {
                logger.log(result);
                alert("@todo");
            })
            .catch(logger.error);

        this.logs = () => {
            const modal = $uibModal.open({
                controller: "LogsCtrl",
                controllerAs: "vm",
                resolve: {
                    logs: () => new Promise((resolve, reject) => {
                        fs.readFile(logger.findLogPath(), "utf8", (err, logs) => {
                            if (err && err.code !== "ENOENT") {
                                reject(err);
                                return;
                            }

                            resolve(logs);
                        });
                    })
                },
                size: "lg",
                templateUrl: "src/views/controller/logs.html"
            });

            return modal.result.then(() => {
                logger.info("Closed log modal");
            }).catch(() => {
                logger.info("Closed log modal");
            });
        };

        this.pid = "";

        this.queue = [];

        this.queuePercent = {};

        this.refreshCache = () => getIplayer.refresh(true);

        this.remove = prog => {
            this.queue = this.queue.reduce((result, item) => {
                if (item.pid !== prog.pid) {
                    result.push(item);
                }

                return result;
            }, []);
        };

        this.running = false;

        this.search = "";

        this.searchResult = [];

        this.settings = () => {
            const modal = $uibModal.open({
                controller: "SettingsCtrl",
                controllerAs: "vm",
                size: "lg",
                templateUrl: "src/views/controller/settings.html"
            });

            return modal.result.then(() => {
                logger.info("Closed settings modal");
            }).catch(() => {
                logger.info("Closed settings modal");
            });
        };

        this.stop = () => {
            getIplayer.emit("STOP_DOWNLOADS");
        };

        this.submit = () => {
            this.running = true;

            const types = [];

            _.each(this.types, (selected, type) => {
                if (selected) {
                    types.push(type);
                }
            });

            return getIplayer.search(this.search, types)
                .then(result => {
                    this.running = false;

                    this.searchResult = result;

                    $scope.$apply();
                })
                .catch(logger.error);
        };

        this.types = {
            tv: true,
            radio: true
        };

        /* Begin with refreshing the cache */
        $timeout(() => {
            getIplayer.refresh();
        }, 10);

    }
];
