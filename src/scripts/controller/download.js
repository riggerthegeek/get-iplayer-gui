/**
 * download
 */

/* Node modules */

/* Third-party modules */
import { _ } from "lodash";

/* Files */

export default function (getIplayer, $scope) {

    getIplayer
        .on("downloadPercent", (pid, percent) => {
            this.queuePercent[pid] = percent;

            $scope.$apply();
        })
        .on("downloadComplete", pid => {
            this.queuePercent[pid] = 100;
        });

    this.addToQueue = prog => {
        const repeat = this.queue.filter(({ pid }) => prog.pid === pid);

        if (repeat.length === 0) {
            this.queuePercent[prog.pid] = 0;

            this.queue.push(prog);
        }
    };

    this.allTypes = {
        // liveradio: 'Live Radio',
        // livetv: 'Live TV',
        // localfiles: 'Local Files',
        // podcast: 'Podcast',
        radio: 'Radio',
        tv: 'TV'
    };

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
            console.log("all complete");
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
                .catch(err => {
                    console.log(err);
                });
        }
    };

    this.getInfo = prog => getIplayer.info(prog.pid)
        .then(result => {
            console.log(result);
            alert("@todo");
        });

    this.queue = [/*{
        pid: "b00hr4lp"
    }, {
        pid: "b00hv1f4"
    }, {
        pid: "b087qjzk"
    }, {
        pid: "b088fg48"
    }, {
        pid: "b08b7wd3"
    }*/];

    this.queuePercent = {};

    this.running = false;

    this.search = 'old harry';

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
            });
    };

    this.types = {
        tv: true,
        radio: true
    };

};
