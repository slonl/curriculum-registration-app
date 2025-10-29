const express   = require('express');
const fs        = require('fs');
const crypto 	  = require('crypto');
const Mailjet 	= require('node-mailjet');

const app       = express();
const port      = process.env.NODE_PORT;

const mailjet = new Mailjet({
  apiKey: process.env.MJ_APIKEY_PUBLIC,
  apiSecret: process.env.MJ_APIKEY_PRIVATE
});

app.route('/').get((req, res) => {
	var user = req.query.email;
	if (!user) {
		res.status(400);
		res.send('Geen email opgegeven');
		return;
	}
	const emailRE = /^.*@.*\.[^\.]{2,}$/
	if (!emailRE.test(user)) {
		res.status(400);
		res.send('Ongeldig email adres opgegeven');
		return;
	}

	console.log("Register " + user);
	
	var keyData = fs.readFileSync("apiKeys.json", "utf8");
	keyData = JSON.parse(keyData);

	var today = new Date();
	var dd = String(today.getDate()).padStart(2, '0');
	var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
	var yyyy = today.getFullYear();
	today = yyyy + '-' + mm + '-' + dd;

	let message = '';
  try {
		if (!keyData[user]) {
			keyData[user] = {
				key : crypto.randomUUID(),
				created : today
			};
			sendApiKey(user, keyData[user].key);
			message = 'APIKey aangemaakt en verstuurd';
		} else {
			sendApiKey(user, keyData[user].key);
			message = 'APIKey opnieuw verstuurd';
		}

		fs.writeFileSync("apiKeys.json.new", JSON.stringify(keyData, null, 2));
		fs.renameSync("apiKeys.json.new", "apiKeys.json");
		res.send(message);
	} catch(err) {
		res.status(500);
		res.send(err.message);
		console.error(err.message);
	}
});

async function sendApiKey(email, key) {
    //Mailjet: from https://www.npmjs.com/package/node-mailjet
		try {
		    await mailjet
        .post('send', { version: 'v3.1' })
        .request({
          Messages: [
            {
              From: {
		        email: "opendata@slo.nl",
		        name: "SLO Opendata",
              },
              To: [
                {
                  Email: email,
                }
              ],
              Subject: "SLO Opendata API Key",
              TextPart: "Bedankt voor het registreren op opendata.slo.nl. Je API key is: '" + key + "' .",
            }
          ]
        });
     } catch(err) {
     		console.error(err);
     		throw new Error('Kon geen email versturen, probeer het later nog eens.');
     }
}

app.listen(port, () => console.log(`API keys server listening on port ${port}!`));