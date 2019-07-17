// this is the object which represents a complete daily menu for one dining location
// from https://github.com/nikolabura/Fetcher

const https = require("https");

class DiningMenu {
	constructor(menuDateArg) {
		this.menuDate = menuDateArg;
		this.httpResponse = "";
		this.menuJson = {};
	}
	
	fetchMenuFromInternet (callback) {
		console.log("\nRequesting menu JSON...");
		const completeUrl = "https://api.dineoncampus.com/v1/location/menu?site_id=5751fd3690975b60e04893e2&platform=0&location_id=5873e39e3191a200fa4e8399&date=" + this.menuDate;
		var req = https.request(completeUrl, (res) => {
			console.log("Recieved details!");
			console.log(`STATUS: ${res.statusCode}`);
			console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
			res.setEncoding('utf8');
			res.on('data', (chunk) => {
				console.log("Got details chunk.");
				this.httpResponse += chunk;
			});
			res.on('end', () => {
				if (res.statusCode != 200) {
					console.log("RECIEVED BAD HTTP STATUS CODE, CANCELLING THIS DETAILS PAGE SEQUENCE.");

					return;
				}
				console.log("No more data in details.");
				this.menuJson = JSON.parse(this.httpResponse);
				callback(JSON.parse(this.httpResponse));
			});
		});
		req.end();
	}
}

module.exports = DiningMenu;
