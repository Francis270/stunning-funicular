const keys = require("./keys");

const Binance = require("node-binance-api");

const binance = new Binance().options({ APIKEY: keys.BINANCE_API_KEY, APISECRET: keys.BINANCE_SECRET_KEY });

const SYMBOL = "ETHUSDT";
const INTTERVAL = "1m";

const log = (symbol, last, isInTrade) => {
    const date = new Date();

    console.log(date.toLocaleString());
    console.info(`${symbol}'s last price: ${last}`);
    console.info(`actually ${isInTrade ? "" : "not "}in a trade for ${symbol}`);
    console.log("");
}

const doesCrossover = (firsts, seconds) => {
    return firsts[firsts.length - 2] < seconds[seconds.length - 2] && firsts[firsts.length - 1] > seconds[seconds.length - 1];
}

const isTooLow = (prices) => {
    const RSI = require("technicalindicators").RSI;
    const rsivalues = RSI.calculate({period : 14, values : prices});
    const lowerband = 30;

    return (rsivalues[rsivalues.length - 2] < lowerband && rsivalues[rsivalues.length - 1] > lowerband);
}

const roundDownFLoat = (number, fix) => {
    let minus = "0.";

    for (let index = 0; index < fix; index++) {
        minus += "0";
    }
    minus += "1";
    return (number - parseFloat(minus)).toFixed(fix);
}

const main = async (last) => {
    binance.candlesticks(SYMBOL, INTTERVAL, (error, ticks, symbol) => {
        let prices = ticks.map(tick => {
            return parseFloat(tick[4])
        });
        prices.pop();
        let curr = prices[prices.length - 1];

        binance.openOrders(SYMBOL, (error, openOrders, symbol) => {
            if (curr != last) {
                const isInTrade = openOrders.length > 0;
    
                last = curr;
                if (!isInTrade) {
                    binance.balance((error, balances) => {
                        const usdt = balances.BUSD.available;
                        const quantity = roundDownFLoat(usdt / last, 5);
                    
                        if (isTooLow(prices)) {
                            log(symbol, last, isInTrade);
                            //binance.marketBuy(SYMBOL, quantity);
                            // setup a stop loss / take profit trade
                        }
                    });
                }
            }
            return main(last);
        });
    }, {limit: 100});
}

(() => {
    main(0);
}) ();