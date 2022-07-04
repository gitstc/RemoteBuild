const path = require('path');

const config = {
    rootDir: __dirname,
    buildDir: path.join(__dirname, 'media', 'builds'),
    uploadDir: path.join(__dirname, 'media', 'uploads'),
    binDir: path.join(__dirname, 'bin')
}

module.exports = config;