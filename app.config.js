export default ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    // All APIs are free - no keys required
  },
});
