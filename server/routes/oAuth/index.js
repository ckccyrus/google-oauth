const { OAuth2Client } = require('google-auth-library');
const http = require('http');
const url = require('url');
const destroyer = require('server-destroy');

const appRoot = require('app-root-path');
const Messenger = require(`${appRoot}/utils/messenger`);

const { CONFIG } = require("./CONFIG");

// Download OAuth2 configuration from the Google 
// const clientSecret = require("../../credentials/client_secret.json");


class OAuth {
    _open;
    _token;
    _oAuth2Client;
    _instance;

    constructor() { }

    static getInstance() {
        const _self = this;
        if (!_self._instance) {
            _self._instance = new OAuth();
        }
        return _self._instance;
    }

    async init() {
        Messenger.openClose("Initialize Google OAuth2Client")
        const _self = this;
        await _self.getOpenPackage();
        await _self.initOauth().catch(console.error);
        Messenger.openClose("/Initialize Google OAuth2Client")
    }

    async getOpenPackage() {
        const _self = this;
        _self._open = (await import('open')).default
    }

    async initOauth() {     //https://github.com/googleapis/google-auth-library-nodejs?tab=readme-ov-file#oauth2
        const _self = this;
        _self._oAuth2Client = await _self.getAuthenticatedClient();

        // const tokenInfo = await _self._oAuth2Client.getTokenInfo(     //Checking access_token information
        //     _self._oAuth2Client.credentials.access_token
        // );

        Messenger.openClose("Login successfully")

        _self._oAuth2Client.on('tokens', $credentials => {
            Messenger.openClose("Token events trigger");
            _self._oAuth2Client.setCredentials($credentials);
            _self._oAuth2Client.credentials.refresh_token = _self._token.refresh_token;
            Messenger.log("credentials UPDATE :>>", $credentials);
        })
    }

    /**
    * Create a new OAuth2Client, and go through the OAuth2 content
    * workflow.  Return the full client to the callback.
    */
    getAuthenticatedClient() {
        const _self = this;
        return new Promise((resolve, reject) => {
            // create an oAuth client to authorize the API call.  Secrets are kept in a `client_secret.json` file,
            // which should be downloaded from the Google Developers Console.
            const oAuth2Client = new OAuth2Client(
                // clientSecret.web.client_id,
                // clientSecret.web.client_secret,
                // clientSecret.web.redirect_uris,
                process.env.GOOGLE_OAUTH_CLIENT_ID,
                process.env.GOOGLE_OAUTH_CLIENT_SECRET,
                process.env.GOOGLE_OAUTH_REDIRECT_URLS
            );

            // Generate the url that will be used for the consent dialog.
            const authorizeUrl = oAuth2Client.generateAuthUrl({
                access_type: 'offline',     //for the refresh token to be given
                prompt: "consent",
                scope: CONFIG.SCOPE,
            });

            // Open an http server to accept the oauth callback. In this simple example, the
            // only request to our webserver is to /oauth2callback?code=<code>
            const server = http
                .createServer(async (req, res) => {
                    try {
                        if (req.url.indexOf(CONFIG.REDIRECT_PATH) > -1) {
                            // acquire the code from the querystring, and close the web server.
                            const qs = new url.URL(req.url, CONFIG.REDIRECT_DOMAIN)
                                .searchParams;
                            const code = qs.get('code');
                            console.log(`Code is ${code}`);
                            res.end('Authentication successful! Please return to the console.');
                            server.destroy();

                            // Now that we have the code, use that to acquire tokens.
                            const r = await oAuth2Client.getToken(code);
                            // Make sure to set the credentials on the OAuth2 client.
                            oAuth2Client.setCredentials(r.tokens);
                            _self._token = r.tokens; //refresh_token is only returned on the first authorization
                            console.info('Tokens acquired.');
                            resolve(oAuth2Client);
                        }
                    } catch (e) {
                        reject(e);
                    }
                })
                .listen(CONFIG.REDIRECT_PORT, () => {
                    // open the browser to the authorize url to start the workflow
                    _self._open(authorizeUrl, { wait: false }).then(cp => cp.unref());
                });
            destroyer(server);
        })
    }

    get oAuth2Client() {
        const _self = this;
        return _self._oAuth2Client;
    }
}

module.exports = OAuth;