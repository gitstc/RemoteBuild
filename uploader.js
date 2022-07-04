const fs = require('fs-extra');
const path = require('path');
const formidable = require('formidable');

const config = require('./config');

module.exports.uploadFile = (req) => {
    console.log('upload...')
    return new Promise((resolve, reject) => {
        let fileName = "";
        let filePath = "";
        let buildDir = "";
        let buildNo = "";
        let outDir = "";

        console.log('Uploading to ' + config.uploadDir)

        fs.ensureDir(config.uploadDir).then(continueUpload);

        function continueUpload() {
            console.log('continue upload...');
            new formidable.IncomingForm()
                .parse(req)
                .on('fileBegin', (name, file) => {
                    outDir = path.join(config.uploadDir, buildDir);
                    if (!fs.existsSync(outDir)) {
                        fs.mkdirSync(outDir);
                    }

                    file.path = path.join(outDir, file.name);

                    fileName = file.name;
                    filePath = file.path;
                })
                .on('file', (name, file) => {
                    resolve({
                        fileName,
                        filePath,
                        buildDir,
                        buildNo
                    });
                })
                .on('field', (name, field) => {
                    if (name == "buildNo") {
                        buildDir = field;
                        buildNo = field;
                    }
                })
        }
    });
}