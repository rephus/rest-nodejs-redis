var express = require("express");
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json());

//Config file with security key for GET endpoint
var config = require('./config.json');

var redis = require('redis').createClient();

// LOGGER
var logFactory = require('./log.js');
var logger = logFactory.create("rest");

app.get('/', function(req, res){
    var params = req.query;
    logger.info("Received GET params " + JSON.stringify(params) );

    if (params.key == config.key) {
      redis.hgetall(config.redisKey, function(err, map){
        if (!map) {
          res.json({});
          return;
        }
        var keys = Object.keys(map);
        var convertedMap = {};
        for (var i = 0; i < keys.length; i++){
          var user = keys[i];
          var geoData = map[user];
          try{
            convertedMap[user] = JSON.parse(geoData);
          } catch (e){
            logger.error("Unable to convert user data " + geoData, e);
          }
        }
        res.json(convertedMap);
      });
    } else {
      res.json({error: "Invalid credentials"}, 403);
    }

});
app.post('/', function(req, res){
    var json = req.body;
    logger.info("Received POST body " + JSON.stringify(json) );

    /*
    {"user": "rephus", "latitude":51.5296836,"longitude":-0.080295,"accuracy":20,"altitude":0,"timestamp":1478862542144,"speed":0,"heading":0}
    */
    if (!json.user) {
      res.json({error: "Invalid request, field user required"}, 400)
    } else {
      redis.hset(config.redisKey, json.user, JSON.stringify(json));
      res.json(json);
    }

});

app.listen(config.port);

logger.info("Rest API started on http://localhost:"+config.port);
