import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    googlePlacesApiKey: process.env.GOOGLE_PLACES_API_KEY || '',
  },
});
