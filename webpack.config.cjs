const path = require('path');

module.exports = {
    target: 'web',
    entry: path.join(path.resolve(__dirname), './src/index.ts'),
    output: {
        filename: './index.js',
        path: path.resolve(__dirname),
        library: 'hydrate',
        libraryTarget: 'umd',
        umdNamedDefine: true,
        globalObject: `window`
    },
    mode: 'production',
    resolve: {
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: 'ts-loader',
                options: {
                    configFile: path.join(path.resolve(__dirname), 'tsconfig.json')
                }
            }
        ]
    },
    devtool: 'source-map',
    optimization: {
        minimize: false,
    }
};
