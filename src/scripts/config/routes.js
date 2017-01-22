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
            children: [{
                name: "download",
                url: "download"
            }]
        })
        .state({
            name: "error",
            data: {
                pageTitle: "{{ 'PAGE_TITLES.ERROR' | translate }}"
            },
            params: {
                error: null
            },
            views: {
                "content@": {
                    controller: "ErrorCtrl",
                    controllerAs: "vm",
                    templateUrl: "src/views/controller/Error.html"
                }
            }
        });

    $urlRouterProvider.otherwise("/download");

};
