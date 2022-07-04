const spawn = require('child_process').spawn;
let command = require.resolve(require('path').join(__dirname, 'bin', 'add_platform.sh'));
let cmd = spawn('sh ' + command, ['/Users/apple/Desktop/RemoteBuild/media/builds/com-fb-test/', 'ios'], { shell: true });
cmd.stdout.on('data', (data) => {
    console.log(data.toString());
})
cmd.stderr.on('data', (data) => {
    console.log(data.toString());
})