const CONFIG = {
    SCOPE: "https://www.googleapis.com/auth/spreadsheets",
    REDIRECT_DOMAIN: "http://localhost:1111",      //set in the Google console
    REDIRECT_PATH: "/oauth2callback",
    REDIRECT_PORT: "1111",      //set in the Google console
}

module.exports = { CONFIG }