var url = require("url");
var querystring = require("querystring");
var fs = require("fs");
var request = require("request");
var child_process = require('child_process');

var liveStarted = false;
var liveffmpeg;

var clients = [];
var clen;
var headBuffer = null;

var rtmpURL = "rtmp://server/app/live_name";

function liveStream(req, resp) {

	resp.writeHead(200, {
		"Connection": "keep-alive",
		"Content-Type": "video/mp4",
		"Accept-Ranges": "bytes"
	});
	clients.push(resp);
	clen = clients.length - 1;
	if (headBuffer) {
		resp.write(headBuffer);
	}

	if (!liveStarted) {
		liveffmpeg = child_process.spawn("ffmpeg", [
			"-re",
			"-i",
			rtmpURL,
			"-c",
			"copy",
			"-f",
			"flv",
			"-"
		], {
			detached: true
		});

		liveStarted = true;

		liveffmpeg.stdout.on("data", function(data) {
			if (!headBuffer) {
				headBuffer = Buffer.concat([data]);
			}
			for (var i = 0; i <= clen; i++) {
				clients[i].write(data);
			}
		});

	}
	req.on("close", function() {
		clearClient(resp);
	})

	req.on("end", function() {
		clearClient(resp);
	});
	return true;
}

function clearClient(esp) {
	var f = -1;
	for (var i = 0; i < clients.length; i++) {
		if (clients[i] == esp) {
			f = i;
		}
	}
	clients.splice(f, 1);
	clen = clients.length - 1;
}

var http = require("http");
http.createServer(liveStream).listen(1337, "0.0.0.0");
