module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            [
                'module-resolver',
                {
                    root: ['.'],
                    alias: {
                        '@config': './src/config',
                        '@ds': './src/design-system',
                        '@components': './src/components',
                        '@contexts': './src/contexts',
                        '@hooks': './src/hooks',
                        '@services': './src/services',
                        '@appTypes': './src/types',
                        '@utils': './src/utils',
                    },
                },
            ],
            'react-native-reanimated/plugin',
        ],
    };
};
