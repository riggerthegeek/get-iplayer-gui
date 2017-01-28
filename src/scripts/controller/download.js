/**
 * download
 */

/* Node modules */

/* Third-party modules */
import { _ } from "lodash";

/* Files */

export default function (getIplayer, logger, $scope, $timeout) {

    getIplayer
        .on("cacheRefreshStart", () => {
            this.running = true;

            $scope.$apply();
        })
        .on("cacheRefreshEnd", () => {
            this.running = false;

            $scope.$apply();
        })
        .on("downloadPercent", (pid, percent) => {
            this.queuePercent[pid] = percent;

            $scope.$apply();
        })
        .on("downloadComplete", pid => {
            this.queuePercent[pid] = 100;
        })
        .on("fileInCache", pid => {
            this.queue = this.queue.map(queue => {
                if (queue.pid === pid) {
                    queue.complete = true;
                }

                return queue;
            });

            // @todo display message
            logger.log(`${pid} in cache`);
        });

    this.addToQueue = prog => {
        const repeat = this.queue.filter(({ pid }) => prog.pid === pid);

        if (repeat.length === 0) {
            this.queuePercent[prog.pid] = 0;

            this.queue.push(prog);
        }
    };

    this.allTypes = getIplayer.types;

    this.download = () => {
        const concurrentDownloads = 2;

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

    this.getInfo = prog => getIplayer.info(prog.pid)
        .then(result => {
            logger.log(result);
            alert("@todo");
        })
        .catch(logger.error);

    this.queue = [];

    this.queuePercent = {};

    this.refreshCache = () => getIplayer.refresh(true);

    this.running = false;

    this.search = "";

    this.searchResult = [];

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
