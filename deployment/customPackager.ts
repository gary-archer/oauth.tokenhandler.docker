import admzip from 'adm-zip';
import fs from 'fs-extra';
import process from 'process';

class Packager {

    /*
     * Take the zip file serverless produces and repackage it programmatically
     */
    public async execute(): Promise<void> {

        // Unzip the default package created by the sls package command
        const packageName = 'oauthwebproxy';
        await this._unzipPackage(packageName);

        // Copy in the deployed configuration
        await fs.copy('api.config.deployed.json', `.serverless/${packageName}/api.config.json`);

        // Rezip the package
        await this._rezipPackage(packageName);
    }

    /*
     * Unzip a package to a temporary folder for customizing
     */
    private async _unzipPackage(packageName: string) {

        const zip = new admzip(`.serverless/${packageName}.zip`);
        zip.extractAllTo(`.serverless/${packageName}`, true);
    }

    /*
     * Rezip the package ready to deploy as a lambda
     */
    private async _rezipPackage(packageName: string) {

        // Delete the zip package that serverless created
        await fs.remove(`.serverless/${packageName}.zip`);

        // Recreate the zip package
        const zip = new admzip();
        zip.addLocalFolder(`.serverless/${packageName}`);
        zip.writeZip(`.serverless/${packageName}.zip`);

        // Delete the temporary folder
        await fs.remove(`.serverless/${packageName}`);
    }
}

(async () => {
    try {

        // Try to run the packager
        const packager = new Packager();
        await packager.execute();

    } catch (e) {

        // Report errors
        console.log(`Packaging error: ${e}`);
        process.exit(1);
    }
})();