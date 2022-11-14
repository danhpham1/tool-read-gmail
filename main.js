const { Mongodb } = require("./db/mongo");
const { Gmail } = require("./gmail");
const { ShopRepo } = require("./repo/shop");

require('dotenv').config();

const main = async () => {
    try {
        const mongodb = new Mongodb();

        mongodb.connect();

        const shopRepo = new ShopRepo(mongodb);

        const gmail = new Gmail(shopRepo);

        await gmail.authorize();

        await gmail.readMessagesAndUpdate();

    } catch (error) {
        console.log(error);
    }
}

main();