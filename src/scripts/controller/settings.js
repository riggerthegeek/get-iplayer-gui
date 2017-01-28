/**
 * settings
 */

/* Node modules */

/* Third-party modules */

/* Files */

export default function (logger, settings, $uibModalInstance) {

    this.cancel = () => $uibModalInstance.dismiss("cancel");

    this.settings = settings.getAll();

    this.save = () => {
        logger.info("Saved settings", this.settings);

        return settings.save(this.settings)
            .then(() => $uibModalInstance.close());
    };

}
