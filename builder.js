const fs = require('fs');
const path = require('path');
const spawn = require('child_process').spawn;

const config = require('./config');

module.exports.addPlatform = (projectPath, platform, outputCB) => {
    console.log('Building for ' + platform);
    return new Promise((resolve, reject) => {
        /**
         * Make sure to perform the following first
         * chmod +x ./bin/add_platform.sh
         */
        let command = 'sh ' + require.resolve(path.join(config.binDir, 'add_platform.sh'));

        let cmd = spawn(command, [projectPath, platform], { shell: true });
        cmd.stdout.on('data', (data) => {
            data = (data || "").toString().trim();

            if (data.length == 0) return;

            //console.log("CMD: " + data);
            outputCB ? outputCB(data) : false;
        })
        cmd.stderr.on('data', (err) => {
            //console.error("Error " + err);

            outputCB ? outputCB(err) : false;
            cmd.kill();
        })
        cmd.on('close', (code) => {
            console.log('build finished with code ' + code);
            if (code === 0 || code == null) {
                console.log('Build Success');
                resolve();
            }
            else {
                console.log('Build Error');
                reject(`Build process exited with code ${code}`)
            }
        })
    })
}