module.exports = {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
    moduleNameMapping: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^react-router-dom$': '<rootDir>/src/__mocks__/react-router-dom.js',
    },
    transformIgnorePatterns: [
        'node_modules/(?!react-router-dom|@testing-library)',
    ],
};