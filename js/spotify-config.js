/* Spotify OAuth configuration.
   Replace SPOTIFY_CLIENT_ID with the Client ID from Spotify Developer Dashboard.
   The Redirect URI must exactly match your registered URI. */
window.SPOTIFY_CONFIG = {
  clientId: 'a5dd486ff00a4694b004bb9b3d583591',
  redirectUri: window.location.origin + window.location.pathname,
  scopes: ['user-read-private', 'user-read-email']
};
