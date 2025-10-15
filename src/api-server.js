const express   = require('express');
const fs        = require('fs');
const path      = require('path');
const url       = require('url');
const crypto 	= require('crypto');
const Mailjet 	= require('node-mailjet');

const app       = express();
const port      = process.env.NODE_PORT //|| 4800;
const apiBase   = process.env.NODE_BASE //|| "https://opendata.slo.nl/curriculum-registration-app/register/";
const baseDatasetURL = process.env.NODE_APIKEY_URL //|| 'https://opendata.slo.nl/curriculum-registration-app/';
const baseDatasetPath = url.parse(baseDatasetURL).pathname;

const mailjet = new Mailjet({
  apiKey: process.env.MJ_APIKEY_PUBLIC,
  apiSecret: process.env.MJ_APIKEY_PRIVATE
});


const notfound  = { error: "not found"};

const baseVariables = { 
		'baseDatasetURL' : baseDatasetURL,
}

function getVars(params={}) {
	Object.assign(params, baseVariables)
	return params
}

app.use(express.static(process.cwd()+'/www'))

app.use(function(req, res, next) {
	res.header('Access-Control-Allow-Credentials', true);
	res.header('Access-Control-Allow-Origin', req.headers.origin ? req.headers.origin : '*');
	res.header('Access-Control-Allow-Headers', 'Authorization');

	if ('OPTIONS' == req.method) {
		res.sendStatus(200);
		return;
	} else if (req.accepts('html')) {
		res.set('Content-Type', 'text/html');
		let filePath = path.join(__dirname, '../data-browser/', 'index.html');
		let file = fs.readFileSync(filePath, 'utf8');
		process.env.NODE_PORT = port;
		process.env.NODE_BASE = apiBase;	
		process.env.NODE_DATA_URL = baseDatasetURL;
		file = file.replace(/\{@(.*)\}/gm, (match, p1) => process.env[p1] || '');
		res.send(file);
		return;
	}
	next();
});


app.route('/' + 'register/').get((req) => {
	var user = req.query.email;
	console.log("Register " + user);
	
	var keyData = fs.readFileSync("apiKeys.json", "utf8");
	keyData = JSON.parse(keyData);

	var today = new Date();
	var dd = String(today.getDate()).padStart(2, '0');
	var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
	var yyyy = today.getFullYear();
	today = yyyy + '-' + mm + '-' + dd;
	
	if (!keyData[user]) {
		keyData[user] = {
			key : crypto.randomUUID(),
			created : today
		}
		sendApiKey(user, keyData[user].key);
	} else {
		sendApiKey(user, keyData[user].key);
	}

	fs.writeFile("apiKeys.json.new", JSON.stringify(keyData, null, 2), function() {
		fs.rename("apiKeys.json.new", "apiKeys.json", readKeys);
	});
});

function readKeys() {
	var keyData = fs.readFileSync("apiKeys.json", "utf8");
	try {
		keyData = JSON.parse(keyData);
	} catch (e) {
		console.log("Invalid JSON in key API data");
		console.log(e);
	}
	apiKeys = keyData;
}

function sendApiKey(email, key) {
    console.log("sending email to : " + email + " with key: " + key )
    
	/*
    //Mailjet: from https://www.npmjs.com/package/node-mailjet
    const request = mailjet
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
              TextPart: "<p>Bedankt voor het registreren op opendata.slo.nl. Je API key is:<br><b>" + key + "</p>",
            }
          ]
        })

    request
    .then((result) => {
        console.log(result.body)
    })
    .catch((err) => {
        console.log(err.statusCode)
    })
	*/
}

app.listen(port, () => console.log(`API keys server listening on port ${port}!`));