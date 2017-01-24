/**
 * download
 */

/* Node modules */

/* Third-party modules */

/* Files */

export default function (getIplayer) {

    this.search = 'wrigg';

    this.submit = () => Promise.all([
        getIplayer.search(this.search, 'tv'),
        getIplayer.search(this.search, 'radio')
    ]).then(([ tv, radio ]) => {

        console.log({
            tv,
            radio,
        });

    });

};
