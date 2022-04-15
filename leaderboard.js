const request = require('request');
let xlsx = require("json-as-xlsx")
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fs = require('fs');

const url = "https://www.espncricinfo.com/series/ipl-2021-1249214";
const domain = 'https://www.espncricinfo.com';
let count = 0;
let leaderBoard = [];

request(url, (error, response, html) => {
    if (error) {
        console.error('error:--->>>', error);
    } else {
        // console.log(html);
        const dom = new JSDOM(html);
        const document = dom.window.document;
        const anchorResultURL = document.querySelector('.ds-flex.ds-text-title-xs.ds-items-center').children[1].querySelector('a');
        let resultsURL = anchorResultURL.href;
        resultsURL = domain + resultsURL;
        // console.log(resultsURL);
        request(resultsURL, getScorecard);
    }
});

function getScorecard(error, response, html) {
    if (error) {
        console.error('error:--->>>', error);
    } else {
        // console.log(html);
        const dom = new JSDOM(html);
        const document = dom.window.document;
        const allMatches = document.querySelectorAll('.ds-flex.ds-mx-4.ds-pt-2.ds-pb-3.ds-space-x-4.ds-border-t.ds-border-line-default-translucent');
        // console.log(allMatches.length);
        for (let matchDetailsRow of allMatches) {
            let matchURL = matchDetailsRow.children[2].querySelector('a').href;
            matchURL = domain + matchURL;
            // console.log(matchURL);
            request(matchURL, getAllBatsman);
            count++;
        }
    }
}

function getAllBatsman(error, response, html) {
    if (error) {
        console.error('error:--->>>', error);
    } else {
        // console.log(html);
        const dom = new JSDOM(html);
        const document = dom.window.document;
        const battingTable = document.querySelectorAll('.ds-w-full.ds-table.ds-table-xs.ds-table-fixed.ci-scorecard-table tbody tr');
        for (let playerRow of battingTable) {
            const playerData = playerRow.querySelectorAll('td');
            if (playerData.length == 8) {
                // console.log(playerData[0].textContent);
                let name = playerData[0].textContent;
                let runs = playerData[2].textContent;
                let balls = playerData[3].textContent;
                let fours = playerData[5].textContent;
                let sixes = playerData[6].textContent;
                // console.log(name,runs,balls);
                processPlayer(name, runs, balls, fours, sixes);
            }
        }
        count--;
        if (count == 0) {
            // console.log(leaderBoard);
            let data = JSON.stringify(leaderBoard);
            fs.writeFileSync('batsmanstats.json', data);
            excelWriter(leaderBoard);
            console.log('Congratulations!!! Your Excel File is ready.😊😊😊');
        }
    }
}

function excelWriter(leaderBoard) {

    let excelData = [
        {
            sheet: "All Batsman",
            columns: [
                { label: "Name", value: "Name" }, // Top level data
                { label: "Innings", value: "Innings" }, // Custom format
                { label: "Runs", value: "Runs" },
                { label: "Balls", value: "Balls" },
                { label: "Fours", value: "Fours" },
                { label: "Sixes", value: "Sixes" }, // Run functions
            ],
            content: leaderBoard
        }
    ]

    let settings = {
        fileName: "IPL-2021", // Name of the resulting spreadsheet
        extraLength: 3, // A bigger number means that columns will be wider
        writeOptions: {}, // Style options from https://github.com/SheetJS/sheetjs#writing-options
    }

    xlsx(excelData, settings)
}
// processPlayer('Rohit','88','20','5','6')
// processPlayer('virat','100','53','10','4')
// processPlayer('Rohit','20','40','1','0')
// console.log(leaderBoard);
function processPlayer(name, runs, balls, fours, sixes) {
    runs = parseInt(runs);
    balls = parseInt(balls);
    fours = parseInt(fours);
    sixes = parseInt(sixes);
    for (let i = 0; i < leaderBoard.length; i++) {
        let batsman = leaderBoard[i];
        if (batsman.Name == name) {
            batsman.Runs += runs;
            batsman.Innings += 1;
            batsman.Balls += balls;
            batsman.Fours += fours;
            batsman.Sixes += sixes;
            return;
        }
    }

    let playerObj = {
        Name: name,
        Innings: 1,
        Runs: runs,
        Balls: balls,
        Fours: fours,
        Sixes: sixes
    }
    leaderBoard.push(playerObj);
}