/**
 * download
 */

/* Node modules */

/* Third-party modules */

/* Files */

export default function (getIplayer, $q) {

    this.addToQueue = prog => this.queue.push(prog);

    this.queue = [];

    this.running = false;

    this.search = 'old harry';

    this.searchResult = [];

    this.submit = () => {
        this.running = true;

        return $q.all([
            getIplayer.search(this.search, 'tv'),
            getIplayer.search(this.search, 'radio')
        ]).then(([tv, radio]) => {

            this.running = false;

            const result = [];

            const addType = type => prog => {
                prog.type = type;

                result.push(prog);
            };

            tv.forEach(addType('tv'));
            radio.forEach(addType('radio'));

            this.searchResult = result;

        });
    };

};
