module.exports = {
  // APP_VERSION is passed as an environment variable from the Gradle / Maven build tasks.
  VERSION: process.env.APP_VERSION || 'DEV',
  // The root URL for API calls, ending with a '/'.
  // If this URL is left empty (""), then it will be relative to the current context.
  // If you use an API server, in `prod` mode, you will need to enable CORS
  // (see the `app.cors` property in the `application-*.yml` configurations)
  SERVER_API_URL: '',
};
