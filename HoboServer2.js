//imported libraries
var prompt = require('prompt');
var http = require('http');
var nunjucks = require('nunjucks');
var mysql = require('mysql');
var fs = require('fs');

//Defines Variables
var apiEntranceString = /\/content\/.*/;
imageFileTypes = ['.jpg','.png','.gif','.tif','.bmp'];
audioFileTypes = ['.mp3', '.mp4', '.wav'];
fileTypes = audioFileTypes + imageFileTypes;

//Load pages
var pages = [];

//If db config file exists, load it, otherwise create it
config_file='./config.json';
db_info='';
fs.exists(config_file, function(exists){
    if (exists){
        db_info=JSON.parse(fs.readFileSync(config_file, 'UTF-8'));
    }
    else 
    {   //prompt definitions
        var properties = [
          {
            name: 'username', 
            validator: /^[a-zA-Z\s\-]+$/,
            warning: 'Username must be only letters, spaces, or dashes'
          },
          {
            name: 'database_name',
          },
          {
            name: 'password',
            hidden: true
          }
        ];

        prompt.start();
        prompt.get(properties, function (err, result) {
            if (err) { return onErr(err); }
            //input success
            db_info=result;
            //save to config file
            fs.writeFile(config_file, JSON.stringify(result, null, 4), function(err){
                if(err) console.log(err);
                else console.log("config file created and saved to "+config_file);
            });
        });
        function on_err(err) {
          console.log(err);
          return 1;
        }
    }
});

//Establish db connection
var hoboDB = mysql.createConnection({
	host:'localhost',
	user: db_info.username,
	password: db_info.password.env.DB_PASS,
	database: db_info.database_name
});
hoboDB.connect();

//Set trigger for creating reusable objects in requestHanlder scope
var hasBeenRun = false;

function requestHandler(request, response){
	if (hasBeenRun == false){
		//Defining common callback functions
		function this.sendResponse(err, file){
			if (err){
				console.log(err);
				response.writeHead(200, {'Content-Type': 'text/html'});
				response.end('Error: No such resource.');
			}
			else {
				response.end(file);
			}
		};

		function this.aysnDbCallback(err, result){
			if (typeof pageData == "undefinied"){
				var pageData;
			}
			if (counter == 0){
				if (typeof pages[i].dbRequests.onload != "undefinied"){
					pages[i].dbRequests.onload();
				}
				pages[i].template.render(pageData, this.sendResponse);
			}
			else{
				counter--;
				pageData[pages[i].dbRequests[j].resultName] = result;
			}
		};

		//Creating Template Objects
		for (var i=0; i<pages.length,i++){
			var page = fs.readFile(pages[i].templateFileName,'utf8');
			pages[i].template = nunjunks.compile(page);
		}

		hasBeenRun = true;
	}
	
	//GET Code
	if (request.method == "GET"){
		if (apiEntranceString.test(request.url)){
			//make appropirate db requests
		}
		else if fileTypes.includes(request.url.substring(request.url.lastIndexOf("."),request.url.length-1)){
			//return files
		}
		else{
			//loop through pages
			for (var i=0;i<pages.length;i++){
				//checking the url matches the page's regex
				if pages[i].url.test(request.url){
					//Defined counter for async db requests
					var counter = pages[i].dbRequests.length - 1;
					//making all dbRequests asyncronously and calling callback when all are finished
					for (var j=0;j < counter + 1;j++){
						//Check if dbRequest needs to be evaluated
						if (typeof pages[i].dbRequests[j]["request"] == "String"){
							var query = pages[i].dbRequests[j]["request"];
						}
						if (typeof pages[i].dbRequests[j]["request"] == "Function"){
							var query = pages[i].dbRequests[j]["request"]();
						}
						//Make db Request
						hoboDB.query(query, this.asycDBCallback(err, result));
					}
				}
			}
		}
	}

	//POST Code
	if (request.method == "POST"){

	}
}
