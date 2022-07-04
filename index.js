const fs = require('fs-extra');
const path = require('path');
const express = require('express');
const formiddable = require('formidable');

const config = require('./config');
const utils = require('./utils');
const uploader = require('./uploader');
const archiver = require('./archiver');
const builder = require('./builder');
const xcbuild = require('./xcbuild');

let app = express();

let builds = {};

app.post('/upload', (req, res, next) => {
    console.log('Upload ' + JSON.stringify(req.body))
    uploader.uploadFile(req)
        .then(archiver.extractArchive)
        .then(archivedFile => {
            //console.log(archivedFile);

            builds[archivedFile.buildNo] = {
                error: false,
                complete_upload: true,
                complete_build: false,
                complete_archive: false,
                status: [],
                build: archivedFile
            }
            res.send(archivedFile);
        })
        .catch((ex) => {
            res.send({
                error: true,
                result: ex
            })
        })
})

app.post('/build', (req, res, next) => {
    new formiddable.IncomingForm().parse(req, (err, fields, files) => {
        let build = builds[fields.buildNo];

        builder.addPlatform(fields.buildDir, 'ios', (output) => {
            console.log(utils.stringify(output));
            build.status.push(utils.stringify(output));
        })
            .then(() => {
                build.complete_build = true;
                build.status.push('Archiving and exporting IPA');

                xcbuild.archive(build, path.join(fields.buildDir, 'platforms', 'ios'))
                    .then((data) => {
                        console.log(data);
                        build.complete_archive = true;
                        build.build.bundleId = data.bundleId;
                        build.build.projectName = data.projectName;
                        build.build.ipaPath = data.ipaPath;
                    })
                    .catch((ex) => {
                        build.error = true;
                        build.status.push('RemoteBuildError:' + ex);
                    })
            })
            .catch((ex) => {
                build.error = true;
                build.status.push('RemoteBuildError:' + ex);
            });

        res.send(fields);
    })
})

app.get('/status/:buildNo', (req, res, next) => {
    let build = builds[req.params.buildNo];

    if (!build) {
        res.send({
            error: true,
            result: "Build not found!"
        })
        return;
    }

    let result = Object.assign({}, build);
    result.status = result.status;//.join('\n');

    res.send(result);

    if (result.error) {
        build.status.push('exit');
    }
})

app.get('/download/:buildNo', (req, res, next) => {
    let build = builds[req.params.buildNo];

    if (!build) {
        res.send({
            error: true,
            result: "Build not found!"
        })
        return;
    }

    //let filePath = '/media/builds/' + build.buildNo + '/platforms/ios/bin/' + build.build.projectName + '.ipa';
    let filePath = build.build.ipaPath;

    console.log('Downloading file ' + filePath);

    res.download(path.join(filePath));
});

app.get('/api/test', (req, res, next) => {
    res.send({
        error: false,
        errorNumber: 3,
        result: {
            id: 1,
            code: '001',
            name: 'item 1'
        }
    })
})

function cleanDirectories() {
    return new Promise((resolve, reject) => {
        return resolve();

        console.log('Removing build directory ' + config.buildDir);
        fs.remove(config.buildDir, (err) => {
            if (err) { console.log(err.message) }

            console.log('Removing upload directory ' + config.buildDir);
            fs.remove(config.uploadDir, (err) => {
                if (err) { console.log(err.message) }
                resolve();
            })
        })
    });
}

let port = 3000;
cleanDirectories()
    .then(() => {
        app.listen(port, () => {
            console.log(`Server started on port ${port}`);
        })
    });