const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const config = require('./config');

module.exports.extractArchive = (archivedFile) => {
    return new Promise((resolve, reject) => {
        let outDir = path.join(config.buildDir, archivedFile.buildDir);

        if (!fs.existsSync(config.buildDir)) {
            fs.mkdirSync(config.buildDir);
        }

        if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir);
        }

        let archive = new AdmZip(archivedFile.filePath);
        archive.extractAllToAsync(outDir, true, (err) => {
            if (err) {
                //console.log(err);
                //return reject(err);
            }

            archivedFile.buildDir = outDir;
            resolve(archivedFile);
        })
    })
}