require("dotenv").config({ path: __dirname + "/.env" });
const { twitterClient } = require("./twitterClient.js")
const CronJob = require("cron").CronJob;
const express = require('express')
const app = express()
const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})


const OpenGovTracks = async() => {
    const data = {
        "data": {
            "confirm_total": 0,
            "referendum_locked": 0,
            "referendum_participate": 0,
            "voting_total": 0
        },
        "generated_at": 1699600641,
        "message": "Success"
    }
    
      try {
        const response = await fetch("https://kusama.api.subscan.io/api/scan/referenda/statistics", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
          body: JSON.stringify(data)
        });
        try {
            const getresponse = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=kusama&vs_currencies=USD", {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json; charset=utf-8',
              },
            });
        
            const Data = await getresponse.json();
            const ksmPrice = Data.kusama.usd
            console.log(ksmPrice)
    
        const responseData = await response.json();
        const referendum_locked = Math.floor(responseData.data.referendum_locked / 1000000000000)
        const formattedreferendum_locked = referendum_locked.toLocaleString();
        const referendum_lockedusd = (referendum_locked * ksmPrice).toLocaleString()
        const formattedReferendumParticipates = Math.floor(responseData.data.referendum_participate / 100000000000000)
        const referendum_participate = formattedReferendumParticipates.toLocaleString()
        const voting_total = responseData.data.voting_total
        const confirm_total = responseData.data.confirm_total
        const next_burn = (referendum_locked * 0.2/100).toLocaleString()
        const next_burn_usd = ((referendum_locked * 0.2/100) * ksmPrice).toLocaleString()
        console.log(next_burn, referendum_locked,referendum_participate)
        const tweetData = `OpenGov Treasury Overview \n Available ${formattedreferendum_locked} KSM ($${referendum_lockedusd} USD) \n Next Burn ${next_burn} KSM ($${next_burn_usd} USD) \n KSM Price $${ksmPrice} USD \n Active Voters ${referendum_participate} \n Active Referendums ${voting_total} \n Confirming Referendums ${confirm_total} \n\n #DOT #kusama #OpenGOV #votes  `
        const tweet = async () => {
            try {
              await twitterClient.v2.tweet(tweetData);
            } catch (e) {
              console.log(e)
            }
             }
         
            //  const cronTweet = new CronJob("* * * * *", async () => {
            //     tweet();
            //   });
              
            //   cronTweet.start();
            tweet()
            } catch (error) {
                console.error('Error:', error);
              }
      } catch (error) {
        console.error('Error:', error);
      }
  }

  
  // OpenGovTracks()
  const pollingJob = new CronJob("0 0 1 * *", async () => {
    console.log("Checking for new votes...");
    await OpenGovTracks()
});

// Start the CronJob
pollingJob.start();
