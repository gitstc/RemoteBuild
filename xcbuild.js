const fs = require('fs');
const path = require('path');
const plist = require('plist');

const spawn = require('child_process');
const xmlParser = require('xml-js');

const utils = require('./utils');

function archiveProject(build, command) {
    return new Promise((resolve, reject) => {
        let hasErrors = false;

        let cmd = spawn.exec(command, { maxBuffer: Number.MAX_VALUE }, (err, stdout, stderr) => {
            if (err) {
                console.log('Exec Error: ' + utils.stringify(err));
                //build.status.push(utils.stringify(err));
                reject(utils.stringify(err));
                return;
            }

            if (hasErrors) {
                //build.status.push(utils.stringify(stderr));
                reject(stderr);
            }
            else {
                //build.status.push(utils.stringify(stdout));
                resolve(utils.stringify(stdout));
            }
        });

        cmd.stderr.on('data', (data) => {
            hasErrors = true;
            console.log(utils.stringify(data));
        })

        cmd.stdout.on('data', (data) => {
            console.log(utils.stringify(data));
        })
    })
}

function exportIPA(build, command) {

    console.log('===============================================================')
    console.log('===============================================================')
    console.log('Export IPA: ' + command);
    console.log('===============================================================')
    console.log('===============================================================')

    return new Promise((resolve, reject) => {
        let hasErrors = false;

        let cmd = spawn.exec(command, { maxBuffer: Number.MAX_VALUE }, (err, stdout, stderr) => {
            if (err) {
                console.log('Exec Error: ' + utils.stringify(err));
                //build.status.push(utils.stringify(err));
                reject(utils.stringify(err));
                return;
            }

            if (hasErrors) {
                //build.status.push(utils.stringify(stderr));
                //reject(utils.stringify(stderr));
            }
            //else {
            //build.status.push(utils.stringify(stdout));
            resolve(utils.stringify(stdout));
            //}
        });

        cmd.stderr.on('data', (data) => {
            hasErrors = true;
            console.log(utils.stringify(data));
        })

        cmd.stdout.on('data', (data) => {
            console.log(utils.stringify(data));
        })
    })
}

module.exports.archive = (build, cwd) => {
    return new Promise((resolve, reject) => {
        let buildJson = null;
        let configXml = null;

        try {
            buildJson = require(path.join(cwd, '../../build.json'));
        } catch (ex) { }

        if (!buildJson) {
            reject('build.json file is missing');
            return;
        }

        buildJson = typeof buildJson == "string" ? JSON.parse(buildJson) : buildJson;

        if (typeof buildJson.ios == "undefined") {
            reject('build.json is missing iOS configuration');
            return;
        }
        if (typeof buildJson.ios.release == "undefined") {
            reject('build.json is missing iOS RELEASE configuration');
            return;
        }

        try {
            configXml = fs.readFileSync(path.join(cwd, '../../config.xml'), 'utf8');
        } catch (ex) { console.log(ex); }

        if (!configXml) {
            reject('config.xml file is missing');
        }

        configXml = xmlParser.xml2js(configXml, { compact: true });

        let teamID = (buildJson.ios.release.developmentTeam || "").toString().trim();
        let method = (buildJson.ios.release.packageType || "").toString().trim();
        let profile = (buildJson.ios.release.provisioningProfile || "").toString().trim();
        let signingIdentity = (buildJson.ios.release.codeSignIdentitiy || "iPhone Distribution").toString().trim();
        /* let buildFlags = "";
        (buildJson.ios.release.buildFlag || []).forEach(flag => {
            buildFlags += `--buildFlag='${flag}'`;
        }) */
        let buildFlags = (buildJson.ios.release.buildFlag || []).join(" ");
        let projectName = (configXml.widget.name._text || "").toString().trim();
        let bundleId = (configXml.widget._attributes.id || "").toString().trim();

        console.log('Project Name: ' + projectName);
        console.log('Bundle ID: ' + bundleId);

        if (teamID.length == 0) {
            reject('build.json is missing developmentTeam');
            return;
        }
        if (method.length == 0) {
            reject('build.json is missing packageType');
            return;
        }
        if (profile.length == 0) {
            reject('build.json is missing provisioningProfile');
            return;
        }
        if (bundleId.length == 0) {
            reject('config.xml is missing the bundle id');
            return;
        }
        if (projectName.length == 0) {
            reject('config.xml is missing the project name');
            return;
        }

        let configType = "Development";
        if (signingIdentity.toLowerCase().indexOf("distribution") > -1) {
            configType = "Release";
        }
        let buildConfig = {
            teamID: teamID,
            method: method,
            provisioningProfiles: {}
        }
        buildConfig.provisioningProfiles[bundleId] = profile;

        let exportPlist = plist.build(buildConfig);
        let outDir = path.join(cwd, 'exportOptionsPlist.plist');
        if (fs.existsSync(outDir)) {
            fs.unlinkSync(outDir);
        }
        fs.writeFileSync(outDir, exportPlist, { encoding: 'utf8' });

        //let projectPath = `${path.join(cwd, projectName)}.xcodeproj`;
        let projectPath = `${path.join(cwd, projectName)}.xcworkspace`;
        let archivePath = `${path.join(cwd, projectName)}`;
        let ipaPath = `${path.join(cwd, 'bin')}`;
        let optionsPlistPath = `${path.join(cwd, 'exportOptionsPlist.plist')}`;

        console.log(`:::Archive Path: ${archivePath}`);
        console.log(`:::IPA Path: ${ipaPath}`);
        console.log(`:::Plist Path: ${optionsPlistPath}`);

        /* Xcode Project
        let archiveCommand = `xcodebuild archive -project "${projectPath}" -archivePath "${archivePath}" -scheme "${projectName}" -configuration ${configType} -sdk iphoneos -allowProvisioningUpdates DEVELOPMENT_TEAM="${teamID}" PROVISIONING_PROFILE_SPECIFIER="${profile}" CODE_SIGN_STYLE="Manual" ${buildFlags}`;
        //console.log(archiveCommand);

        let exportCommand = `xcodebuild -project "${projectPath}" -exportArchive -archivePath "${archivePath}.xcarchive" -exportPath "${ipaPath}" -exportOptionsPlist "${optionsPlistPath}"`;
        //console.log(exportCommand);
        */

        //Xcode Workspace
        let archiveCommand = `xcodebuild archive -workspace "${projectPath}" -archivePath "${archivePath}" -scheme "${projectName}" -configuration ${configType} -sdk iphoneos -destination "generic/platform=iOS" DEVELOPMENT_TEAM="${teamID}" PROVISIONING_PROFILE_SPECIFIER="${profile}" CODE_SIGN_STYLE="Manual" ENABLE_BITCODE=NO ${buildFlags}`;
        //console.log(archiveCommand);

        let exportCommand = `xcodebuild -exportArchive -archivePath "${archivePath}.xcarchive" -exportPath "${ipaPath}" -exportOptionsPlist "${optionsPlistPath}"`;
        //console.log(exportCommand);

        archiveProject(build, archiveCommand)
            .then(() => { return exportIPA(build, exportCommand) })
            .then(() => {
                console.log(`IPA saved to ${path.join(ipaPath, projectName + '.ipa')}`);
                resolve({
                    bundleId: bundleId,
                    projectName: projectName,
                    ipaPath: path.join(ipaPath, projectName + '.ipa')
                });
            })
            .catch((ex) => {
                console.log('Exception:::' + ex);
                reject(ex);
            });
    });
}