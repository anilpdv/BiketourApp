const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add custom asset extensions for GPX files (files without extension are treated as text)
config.resolver.assetExts.push('gpx');

// Treat files in euroveloRoutes folder as assets
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
};

module.exports = config;
