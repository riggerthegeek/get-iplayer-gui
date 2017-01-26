/**
 * download
 */

/* Node modules */

/* Third-party modules */
import { _ } from "lodash";

/* Files */

export default function (getIplayer, $q) {

    this.addToQueue = prog => this.queue.push(prog);

    this.allTypes = {
        // liveradio: 'Live Radio',
        // livetv: 'Live TV',
        // localfiles: 'Local Files',
        // podcast: 'Podcast',
        radio: 'Radio',
        tv: 'TV'
    };

    this.download = () => {

        getIplayer.on("downloadPercent", (pid, percent) => {
            console.log({
                pid,
                percent
            });
        });

        return getIplayer.download("b00hr4lp")
            .then(result => {
                console.log(result);
            })
            .catch(err => {
                console.log(err);
            });

    };

    this.getInfo = prog => getIplayer.info(prog.pid)
        .then(result => {
            console.log(result);
            alert("@todo");
        });

    this.queue = [];

    this.running = false;

    this.search = 'old harry';

    this.searchResult = [];

    this.submit = () => {
        this.running = true;

        const tasks = [];

        _.each(this.types, (selected, type) => {
            if (selected) {
                const task = getIplayer.search(this.search, type)
                    .then(result => ({
                        result,
                        type
                    }));

                tasks.push(task);
            }
        });

        return $q.all(tasks)
            .then(data => {

                this.running = false;

                const result = [];

                const addType = type => prog => {
                    prog.type = type;

                    result.push(prog);
                };

                _.each(data, ({ result, type }) => {
                    result.forEach(addType(type));
                });

                this.searchResult = result;

            });
    };

    this.types = {
        tv: true,
        radio: true
    };

};
