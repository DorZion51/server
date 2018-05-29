//this is only an example, handling everything is yours responsibilty !

var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var cors = require('cors');
app.use(cors());
var DButilsAzure = require('./DButils');
var jwt = require('jsonwebtoken');
var Users = require('./Users');
var poi = require('./POI');
var fs = require('fs');
var parser = require('xml2json');


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const secret = "silence";

//midlleeware
app.use('/', function (req, res, next) {
    // check header or url parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    // decode token
    if (token) {

        // verifies secret and checks exp
        jwt.verify(token, secret, function (err, decoded) {
            if (err) {
                return res.json({ success: false, message: 'Failed to authenticate token.' });
            } else {
                // if everything is good, save to request for use in other routes
                // get the decoded payload and header
                var decoded = jwt.decode(token, {complete: true});
                req.decoded= decoded;

                next();
            }
        });

    } else {

        // if there is no token
        // return an error
        return res.status(403).send({
            success: false,
            message: 'No token provided.'
        });
    }

});

app.use('/users', Users);
app.use('/poi', poi);

function readXml(){
    fs.readFile( './countries.xml', function(err, data) {
        var json = parser.toJson(data);
        console.log("to json ->", json);
    });
}


var port = 3000;
app.listen(port, function () {
    console.log('Example app listening on port ' + port);
});
//-------------------------------------------------------------------------------------------------------------------


