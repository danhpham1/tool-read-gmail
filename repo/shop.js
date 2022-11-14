class ShopRepo {
    #dataSource

    constructor(dataSource){
        this.#dataSource = dataSource;
    }

    findOneAndUpdateShop(filter, data) {
        return this.#dataSource.findOneAndUpdate(filter, data);
    }
}

module.exports = {
    ShopRepo
}