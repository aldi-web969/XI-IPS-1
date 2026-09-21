/* Spotify OAuth configuration.
   Replace SPOTIFY_CLIENT_ID with the Client ID from Spotify Developer Dashboard.
   The Redirect URI must exactly match your registered URI. */
window.SPOTIFY_CONFIG = {
  clientId: 'PASTE_YOUR_SPOTIFY_CLIENT_ID_HERE',
  redirectUri: window.location.origin + window.location.pathname,
  scopes: ['user-read-private', 'user-read-email']
};
