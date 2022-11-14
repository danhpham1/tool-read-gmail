const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');
const cheerio = require('cheerio');
const { QUERY_STYLE_STARS, QUERY_STYLE_STORE_NAME, QUERY_EMAIL, QUERY_MAX_RESULTS } = require('../constant');

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

class Gmail {

    #auth

    shopRepo

    constructor(shopRepo) {
        this.shopRepo = shopRepo;
    }

    async #loadSavedCredentialsIfExist() {
        try {
            const content = await fs.readFile(TOKEN_PATH);
            const credentials = JSON.parse(content);
            return google.auth.fromJSON(credentials);
        } catch (err) {
            return null;
        }
    }

    /**
     * Serializes credentials to a file comptible with GoogleAUth.fromJSON.
     *
     * @param {OAuth2Client} client
     * @return {Promise<void>}
     */
    async #saveCredentials(client) {
        const content = await fs.readFile(CREDENTIALS_PATH);
        const keys = JSON.parse(content);
        const key = keys.installed || keys.web;
        const payload = JSON.stringify({
            type: 'authorized_user',
            client_id: key.client_id,
            client_secret: key.client_secret,
            refresh_token: client.credentials.refresh_token,
        });
        await fs.writeFile(TOKEN_PATH, payload);
    }

    /**
     * Load or request or authorization to call APIs.
     *
     */
    async authorize() {
        let client = await this.#loadSavedCredentialsIfExist();
        if (client) {
            this.#auth = client;
            return client;
        }
        client = await authenticate({
            scopes: SCOPES,
            keyfilePath: CREDENTIALS_PATH,
        });
        if (client.credentials) {
            await this.#saveCredentials(client);
        }

        this.#auth = client;
        return client;
    }

    /**
     * Lists the labels in the user's account.
     *
     * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
     */
    async readMessagesAndUpdate(pageToken = '') {
        const gmail = google.gmail({ version: 'v1', auth: this.#auth });
        const res = await gmail.users.messages.list({
            userId: 'me',
            q: QUERY_EMAIL,
            maxResults: QUERY_MAX_RESULTS,
            pageToken: pageToken ?? ''
        });

        const messages = res.data.messages;

        if (!messages || messages.length === 0) {
            return;
        }

        if ( res.data.nextPageToken ) {
            for (let index = 0; index < messages.length; index++) {
                this.#findMessageById(messages[index].id);
            }

            return this.readMessagesAndUpdate(res.data.nextPageToken);
        } else {
            
            for (let index = 0; index < messages.length; index++) {
                this.#findMessageById(messages[index].id);
            }
        }
    }

    async #findMessageById(messageId) {
        const gmail = google.gmail({ version: 'v1', auth: this.#auth });
        const result = await gmail.users.messages.get({
            userId: 'me',
            id: messageId
        })

        if (result.data.payload.parts) {
            await this.#processGetStoreNameAndStartOfEmail(Buffer.from(result.data.payload.parts[1].body.data, 'base64').toString('ascii'))
        }
    }

    async #processGetStoreNameAndStartOfEmail(data) {
        const $ = cheerio.load(data, {
            lowerCaseAttributeNames: true
        });

        const storeName = $(QUERY_STYLE_STORE_NAME).text().split(' ')[0];

        const stars = $(QUERY_STYLE_STARS).text().split(' ')[0]

        if (storeName && stars) {
            console.log(storeName)
            console.log(stars)
        }
    }
}

module.exports = { Gmail }