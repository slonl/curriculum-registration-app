const express   = require('express');
const fs        = require('fs');
const crypto 	  = require('crypto');
const Mailjet 	= require('node-mailjet');

const app       = express();
const port      = process.env.NODE_PORT;
const apiKeysFile = process.env.APIKEYS;
if (!apiKeysFile) {
	console.error('No APIKEYS environment set');
	process.exit();
}
let mailjet

if (process.env.NODE_ENV=='development') {
	mailjet = {
		post: function(part, options) {
			console.log('post',part,options)
			return mailjet
		},
		request: async function(options) {
			console.log('request',options)
		}
	}
} else {
	mailjet = new Mailjet({
	  apiKey: process.env.MJ_APIKEY_PUBLIC,
	  apiSecret: process.env.MJ_APIKEY_PRIVATE
	});
}

app.use(express.static(process.cwd()+'/www'))

app.route('/register/').get((req, res) => {
	res.setHeader('Content-Type','application/json')
	var user = req.query.email;
	if (!user) {
		res.status(400);
		res.send('{"error":"Geen email opgegeven"}');
		return;
	}
	const emailRE = /^.*@.*\.[^\.]{2,}$/
	if (!emailRE.test(user)) {
		res.status(400);
		res.send('{"error":"Ongeldig email adres opgegeven"}');
		return;
	}
	try {
		var keyData = fs.readFileSync(apiKeysFile, "utf8");
		keyData = JSON.parse(keyData);

		var today = new Date();
		var dd = String(today.getDate()).padStart(2, '0');
		var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
		var yyyy = today.getFullYear();
		today = yyyy + '-' + mm + '-' + dd;

		console.log("Register " + user);
		let message = '';

		if (!keyData[user]) {
			keyData[user] = {
				key : crypto.randomUUID(),
				created : today
			};
			fs.writeFileSync("apiKeys.json.new", JSON.stringify(keyData, null, 2));
			fs.renameSync("apiKeys.json.new", "apiKeys.json");
			sendApiKey(user, keyData[user].key);
			message = 'APIKey aangemaakt en verstuurd';
		} else {
			sendApiKey(user, keyData[user].key);
			message = 'APIKey opnieuw verstuurd';
		}

		res.send('{"message":"'+message+'"}');
  } catch(err) {
		console.error(err);
 		res.status(500);
 		res.send('{"error":"Kon geen email versturen, probeer het later nog eens."}');
	}
});

async function sendApiKey(email, key) {
    //Mailjet: from https://www.npmjs.com/package/node-mailjet
    await mailjet
    .post('send', { version: 'v3.1' })
    .request({
      Messages: [
        {
          From: {
		        email: "opendata@slo.nl",
		        name: "SLO Opendata"
          },
          To: [
            {
              Email: email,
            }
          ],
          Subject: "SLO Opendata API Key",
          TextPart: "Bedankt voor het registreren op opendata.slo.nl. Je API key is: '" + key + "' ."
        }
      ]
    });
}

app.listen(port, () => console.log(`API keys server listening on port ${port}!`));