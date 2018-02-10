const path = require('path');

module.exports = {
    entry: './ui/spa/app.js',
    output: {
        filename: 'app.js',
        path: path.resolve(__dirname, '../', 'bamvvm-dist')
    }
};