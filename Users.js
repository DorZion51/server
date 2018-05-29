var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var jwt = require('jsonwebtoken');
var DButilsAzure = require('./DButils');

const secret = "silence";





//register route
router.post('/Register',function(req,resulte){
    let username=req.body.Username;
    let password=req.body.Password;
    let firstname=req.body.Firstname;
    let lastname=req.body.Lastname;
    let city=req.body.City;
    let country=req.body.Country;
    let email=req.body.Email;
    let category=req.body.Category;
    let answer1=req.body.Answer1;
    let answer2=req.body.Answer2;
    let select=`SELECT * FROM Users WHERE username='${username}'`;
    let insert=`INSERT INTO Users VALUES ('${username}','${password}','${firstname}','${lastname}','${city}','${country}','${email}','${answer1}','${answer2}') `;

    let promise=DButilsAzure.execQuery(select);
    promise.then(function(res){
        if(res.length>0){
            resulte.send("this user has exists");
        }
        else{
            DButilsAzure.execQuery(insert);
            for(var i=0;i<category.length;i++){
                DButilsAzure.execQuery(`INSERT INTO Users_Categories VALUES('${username}','${category[i]}')`);
            }
            resulte.send("congradulation");
        }
    })

});

//login route
router.post('/Login',function(req,resulte){
    let username=req.body.Username;
    let password=req.body.Password;
    let select=`SELECT * FROM Users WHERE username='${username}' AND password='${password}'`;
    let promise=DButilsAzure.execQuery(select);
    promise.then(function(res){
        if(res.length==0){
            resulte.send("failed");
        }
        else{
            var payload={
                username:username,
                password:password
            }
            var token=jwt.sign(payload,secret,{
                expiresIn :"1d"
            });

            resulte.json({
                success: true,
                message: 'you have a token',
                token:token
            }) ;

        }
    })
});

//route GetPassword
router.post('/GetPassword',function(req,resulte){
    let token =req.decoded.payload;
    let username=token.username;
    let answer1=req.body.Answer1;
    let answer2=req.body.Answer2;
        let select=`SELECT * FROM Users WHERE (username='${username}' AND answer1='${answer1}' AND answer2='${answer2}')`;
        let x= DButilsAzure.execQuery(select);
        x.then(function(res){
            if(res.length==0){
                resulte.send(" ");
            }
            else{

                resulte.json({password:token.password});
            }
        });

});

//route getUser
router.post('/GetUser',function(req,resulte){
    let token =req.decoded.payload;
    let username=token.username;

        let select=`SELECT * FROM Users WHERE (username='${username}')`;
        let promise=DButilsAzure.execQuery(select);
        promise.then(function(res){
            let r1=res;
            let p2=DButilsAzure.execQuery(`SELECT * FROM Favorite_Points WHERE (username='${username}')`);
            p2.then(function(res){
                let r2=res;
                let p3=DButilsAzure.execQuery(`SELECT * FROM Users_Categories WHERE (username='${username}')`);
                p3.then(function(res){
                    var catg="";
                    for(var i=0;i<res.length;i++){
                        catg+=res[i].category+",";
                    }
                    var pointss="";
                    for(var i=0;i<r2.length;i++){
                        pointss+=r2[i].pointID+",";
                    }
                    resulte.json({firstname:r1[0].firstname,lastname:r1[0].lastname,city:r1[0].city,email:r1[0].email
                        ,country:r1[0].country,favoriteCategories:catg,favoritePoints:pointss,answer1:r1[0].answer1,answer2:r1[0].answer2});
                });
            });
        });
});

//route getCounterPointsOfUser
router.get('/GetCounterPointsOfUser',function(req,resulte){
    let token=req.decoded.payload;
    let username =token.username;
        let bring=`SELECT * FROM Favorite_Points WHERE username='${username}'`;
        DButilsAzure.execQuery(bring).then(function(res){
            resulte.json({numOfPoints:res.length});
        });

});

//route UpdateComment
router.put('/AddComment',function(req,resulte){
    let token=req.decoded.payload;
    let username=token.username;
    let pointId=req.body.PointID;
    let comment="'"+req.body.Comment+"'";
    let check=`SELECT * FROM Users_Comment WHERE username='${username}' AND pointID='${pointId}'`;
    DButilsAzure.execQuery(check).then(function (res) {
        if(res.length==0){
                let update = `INSERT INTO Users_Comment(pointID,username,comment,time) VALUES('${pointId}','${username}',${comment},CURRENT_TIMESTAMP) `;
                DButilsAzure.execQuery(update);
                resulte.sendStatus(200);
        }
        else{
            resulte.send("you already comment this point");
        }
    });
});

router.delete('/DeleteComment',function(req,resulte){
    let token=req.decoded.payload;
    let username=token.username;
    let pointId=req.body.PointID;
    let check=`SELECT * FROM Users_Comment WHERE username='${username}' AND pointID='${pointId}'`;
    DButilsAzure.execQuery(check).then(function (res) {
        if(res.length>0) {
            let deletee = `DELETE FROM Users_Comment WHERE username='${username}' AND pointID='${pointId}' `;
            DButilsAzure.execQuery(deletee);
            resulte.sendStatus(200);
        }
        else{
            resulte.send("you dont have a comment on this point");
        }
    });



});

router.put('/AddRank',function(req,resulte){
    let token=req.decoded.payload;
    let username=token.username;
    let pointId=req.body.PointID;
    let rank=req.body.Rank;
    let check=`SELECT * FROM User_Rank WHERE username='${username}' AND pointID='${pointId}'`;
    DButilsAzure.execQuery(check).then(function (res) {
       if(res.length==0){
               if(parseFloat(rank)>=1 && parseFloat(rank)<=5) {
                   let insert = `INSERT INTO User_Rank(pointID,username,rank) VALUES('${pointId}','${username}',${rank}) `;
                   DButilsAzure.execQuery(insert).then(function(res1){
                       let avg=`SELECT AVG(rank) AS avg FROM User_Rank WHERE pointID='${pointId}  '`;
                       DButilsAzure.execQuery(avg).then(function(res){
                           let update=`UPDATE Points SET rankAvg='${res[0].avg}' WHERE  pointID='${pointId}'`
                           DButilsAzure.execQuery(update);
                           resulte.json({AVG:res[0].avg});
                       });

                   });
               }
               else{
                   resulte.send("The rank must between 1 to 5 ")
               }

       }
       else{
           resulte.send("you already ranked this point");
       }
    });

});



module.exports = router;