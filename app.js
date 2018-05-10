var request = require('request');
var prompt = require('prompt');
var xlsx = require('xlsx');

//var workbook = xlsx.readFile('GrowthStocks.xlsx');
var workbook = xlsx.readFile('test.xlsx');
var workbookJson = xlsx.utils.sheet_to_json(workbook.Sheets['Export']);
var finalStockInfo = {};
workbookJson.forEach(row => {
    var symbol = row.Symbol;
    finalStockInfo[symbol] = {};
    finalStockInfo[symbol]['StrengthRating'] = row['RS Rating'];
    getPriceAndVolume(symbol, finalStockInfo);
    getMovingAverage(symbol, 'EMA', '100', finalStockInfo);
    getMovingAverage(symbol, 'EMA', '200', finalStockInfo);
    getMovingAverage(symbol, 'EMA', '55', finalStockInfo);
    getMovingAverage(symbol, 'EMA', '34', finalStockInfo);
});
setTimeout(function(){
    Object.keys(finalStockInfo).forEach(symbol => {
        var stockObj = finalStockInfo[symbol];
        if(stockObj.Volume > 200000){
            if(stockObj.StrengthRating > 80){
                if(getPercentDifference(stockObj.Price, stockObj['34'])){
                    if(getPercentDifference(stockObj.Price, stockObj['55'])){
                        if(getPercentDifference(stockObj.Price, stockObj['100'])){
                            if(getPercentDifference(stockObj.Price, stockObj['200'])){
                                console.log(symbol, stockObj);
                            }
                        }
                    }
                }
            }
        }
    });

}, 9000);

function getPriceAndVolume(ticker, finalStockInfo){
    var url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${ticker}&apikey=GYWUJPM4V0P0WGF8`;
    request(url, {json: true}, (err, res, body) => {
        if (err) { return console.log(err); }
        var dataKey = 'Time Series (Daily)';
        var data = res.body[dataKey],
        dates = Object.keys(data),
        mostRecentDateKey,
        mostRecentDate = 0;
        dates.forEach(date => {
            var tempDate = Date.parse(date);
            if(tempDate > mostRecentDate){
                mostRecentDate = tempDate;
                mostRecentDateKey = date;
            }
        });
        finalStockInfo[ticker].Price = res.body[dataKey][mostRecentDateKey]['4. close'];
        finalStockInfo[ticker].Volume = res.body[dataKey][mostRecentDateKey]['5. volume'];
        return {
            Price: res.body[dataKey][mostRecentDateKey]['4. close'],
            Volume: res.body[dataKey][mostRecentDateKey]['5. volume']
        };
    })
}

function getMovingAverage(ticker, type, timePeriod, finalStockInfo){
    var url = `https://www.alphavantage.co/query?function=${type}&symbol=${ticker}&interval=daily&time_period=${timePeriod}&series_type=close&apikey=GYWUJPM4V0P0WGF8`;
    request(url, {json: true}, (err, res, body) => {
        if (err) { return console.log(err); }
        var dataKey = `Technical Analysis: ${type}`
        var data = res.body[dataKey],
        dates = Object.keys(data),
        mostRecentDateKey,
        mostRecentDate = 0;
        dates.forEach(date => {
            var tempDate = Date.parse(date);
            if(tempDate > mostRecentDate){
                mostRecentDate = tempDate;
                mostRecentDateKey = date;
            }
        });
        finalStockInfo[ticker][timePeriod]  = res.body[dataKey][mostRecentDateKey][type];
        return res.body[dataKey][mostRecentDateKey][type];
    });
}

function getPricesAndVolume(listOfStocks){
    var url = `https://www.alphavantage.co/query?function=BATCH_STOCK_QUOTES&symbols=${listOfStocks}&apikey=GYWUJPM4V0P0WGF8`;
    request(url, {json: true}, (err, res, body) => {
        if (err) { return console.log(err); }
        console.log(res.body['Stock Quotes']);
        return res.body['Stock Quotes'];
    });
}

function getPercentDifference(price, average){
    return Math.abs(((price - average) / average)*100);
}