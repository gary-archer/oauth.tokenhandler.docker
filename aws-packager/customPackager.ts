import admzip from 'adm-zip';
import ChildProcess from 'child-process-es6-promise';
import fs from 'fs-extra';
import process from 'process';
import './typings';

class CustomPackager {

    /*
     * Take the zip file serverless produces and repackage it programmatically
     */
    public async execute(): Promise<void> {

        // Unzip the default package created by the sls package command
        const packageName = 'tokenhandlerapi';
        await this._unzipPackage(packageName);

        // Exclude Express specific code from AWS
        await this._excludeFolders(packageName, ['dist/express']);

        // Exclude Express dependencies from AWS
        await this._installDependencies(packageName, ['express', 'cookie-parser', 'cors']);

        // Copy in the deployed configuration
        await fs.copy('aws-packager/api.deployed.config.json', `.serverless/${packageName}/api.config.json`);

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
     * Remove folders not relevant to deployed lambdas
     */
    private async _excludeFolders(packageName: string, folders: string[]) {

        for (const folder of folders) {
            await fs.remove(`.serverless/${packageName}/${folder}`);
        }
    }

    /*
     * Install dependencies for the package in an optimized manner resulting in smaller lambda sizes
     */
    private async _installDependencies(packageName: string, removeDependencies: string[]) {

        // Copy in package.json files
        await fs.copy('package.json',      `.serverless/${packageName}/package.json`);
        await fs.copy('package-lock.json', `.serverless/${packageName}/package-lock.json`);

        // Remove development dependencies and those passed in to exclude
        const pkg = await fs.readJson(`.serverless/${packageName}/package.json`);
        delete pkg.devDependencies;
        for (const dependency of removeDependencies) {
            delete pkg.dependencies[dependency];
        }

        // Write back changes and include formatting
        await fs.writeFile(`.serverless/${packageName}/package.json`, JSON.stringify(pkg, null, 2));

        // Do the work of installing node production modules
        await this._installNodeModules(packageName);

        // Remove package.json files from the temporary folder
        await fs.remove(`.serverless/${packageName}/package.json`);
        await fs.remove(`.serverless/${packageName}/package-lock.json`);
    }

    /*
     * Start a child process to install node modules and wait for it to complete
     */
    private async _installNodeModules(packageName: string) {

        try {

            // Configure npm
            console.log(`Installing node modules for ${packageName} ...`);
            const npmCommand = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';
            const options = {
                cwd: `.serverless/${packageName}`,
                capture: ['stdout', 'stderr'],
            };

            // Run a child process and report its output
            const childProcess = await ChildProcess.spawn(npmCommand, ['install'], options);
            console.log(childProcess.stdout);

        } catch (e: any) {

            // Report install errors
            throw new Error(`Error installing npm packages for ${packageName}: ${e} : ${e.stderr.toString()}`);
        }
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
        const packager = new CustomPackager();
        await packager.execute();

    } catch (e: any) {

        // Report errors
        console.log(`Packaging error: ${e}`);
        process.exit(1);
    }
})();