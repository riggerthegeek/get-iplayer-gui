/**
 * routes
 */

/* Node modules */

/* Third-party modules */

/* Files */

export default (stateHelperProvider, $urlRouterProvider) => {

    stateHelperProvider
        .state({
            name: "app",
            url: "/",
            abstract: true,
            resolve: {
                // update: getIplayer => getIplayer.refresh()
            },
            children: [{
                name: "download",
                data: {
                    pageTitle: "Download"
                },
                url: "download",
                views: {
                    "content@": {
                        controller: "DownloadCtrl",
                        controllerAs: "vm",
                        templateUrl: "src/views/controller/download.html"
                    }
                }
            }]
        });

    $urlRouterProvider.otherwise("/download");

};
