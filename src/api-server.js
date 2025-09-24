const express   = require('express');
const fs        = require('fs');
const path      = require('path');
const url       = require('url');
const { v4: uuidv4 } = require('uuid');

const app       = express();
const port      = process.env.NODE_PORT || 4800;
const apiBase   = process.env.NODE_BASE || "http://localhost:4800/register/" //"https://opendata.slo.nl/curriculum-registration-app/register/";
const baseDatasetURL = process.env.NODE_DATA_URL || "http://localhost:4800/"  // 'https://opendata.slo.nl/curriculum-registration-app/';
const baseDatasetPath = url.parse(baseDatasetURL).pathname;

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

/*
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 
               'Origin, X-Requested-With, Content-Type, Accept');
               */
	if ('OPTIONS' == req.method) {
		res.sendStatus(200);
		return;
	} else if (req.accepts('html')) {
		res.set('Content-Type', 'text/html');
		let filePath = path.join(__dirname, '../data-browser/', 'index.html');
		let file = fs.readFileSync(filePath, 'utf8');
		process.env.NODE_PORT = port;
		process.env.NODE_BASE = apiBase;	
//		process.env.NODE_ID_URL = baseIdURL;
//		process.env.NODE_BACKEND_URL = backendUrl;
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
			key : uuidv4(),
			created : today
		}
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
    console.log("sending email still to be implemented")
    /*
	var mail = {
		from: {
		email: "opendata@slo.nl",
		name: "SLO Opendata",
	  },
	  to: {
	  	email: email
	  },
	  subject: "SLO Opendata API Key",
	  content: [
	  	{
	  		type: "text/html",
	  		value: "<p>Bedankt voor het registreren op opendata.slo.nl. Je API key is:<br><b>" + key + "</p>",
	      	},
	    ],
	}
    
	sgMail.send(mail)
	.then(function (response) {
	    console.log(response[0].statusCode);
	    console.log(response[0].headers);
	    console.log("api key mail sent");
	})
	.catch(function (error) {
	    console.log(error);
	});
    */
}

app.listen(port, () => console.log(`API keys server listening on port ${port}!`));