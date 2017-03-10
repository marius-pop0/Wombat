var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
var connections = [];
var users = [];
var css="";
var messageCount=0;
var messages=[];

http.listen( port, function () {
    console.log('listening on port', port);
});

app.use(express.static(__dirname + '/public'));

// listen to 'chat' messages
io.on('connection', function(socket){

    var userCounter=1;
    connections.push(socket);
    console.log('Connected: %s sockets connected', connections.length);
    var user = "user"+userCounter;

    while(users.indexOf(user)!==-1){
        userCounter+=1;
        user="user"+userCounter;
    }
    socket.emit('getCookie',"cook");

    socket.username=user;
    users.push(user);

    socket.emit('update username',socket.username);
    io.emit('cssUpdate', css);
    var usercolor = getUsercolor(socket.username);
    socket.emit('saveCookie',{username: socket.username, color: usercolor});
    updateConnectedUsers();
    console.log('Connected users %s',users);

    //get log history on connect
    socket.emit('sendHistory',messages);



    socket.on('cookie',function(data){
        var cook = data.split('.');
        if(users.indexOf(cook[0])===-1) {
            //update username when cookie is available
            users.splice(users.indexOf(socket.username),1);
            socket.username=cook[0];
            users.push(cook[0]);
            console.log("used cookie update username "+cook[0]);
            socket.emit('update username',socket.username);
            updateConnectedUsers();

            //update css when cookie has data
            if(cook[1].length!=0){
                css=css+"."+socket.username+"{"+cook[1]+";}";
                io.emit('cssUpdate', css);
                console.log("used cookie update css "+cook[1]);
            }
        }
        else{
            console.log("could not update from cookie: username taken")
        }
    });

    socket.on('disconnect',function(data){
        if (!socket.username) return;

        //remove username from active list
        users.splice(users.indexOf(socket.username),1);
        //update active connections for the rest of the users
        updateConnectedUsers();
        connections.splice(connections.indexOf(socket),1);
        console.log('Disconnected: %s sockets connected', connections.length);
    });

    //send the messages to all connected users
    socket.on('chat', function(data){
        var timeNow = new Date().toLocaleTimeString();
        io.emit('chat', {msg: data, user: socket.username, time: timeNow});
    });

    socket.on('log',function (data) {
        //store 200 messages in memory
       if(messageCount<200){
           messageCount+=1;
           //dont log duplicate messages
           if(data!=messages[messages.length-1]){
               messages.push(data);
           }

       }
       else{
           messages.splice(0,1);
           if(data!=messages[messages.length-1]){
               messages.push(data);
           }
       }
    });
    //New User
    socket.on('new users',function(data){
        if(users.indexOf(data)===-1) {
            users.splice(users.indexOf(socket.username),1);

            socket.username = data;
            users.push(socket.username);
            console.log('Connected users %s',users);

            socket.emit('update username',socket.username);
            var usercolor = getUsercolor(socket.username);
            socket.emit('saveCookie',{username: socket.username, color: usercolor});
            updateConnectedUsers()
        }
        else{
            console.log('username taken')
        }

    });
    
    function updateConnectedUsers() {
        io.emit('update users', users);
    }
    function getUsercolor(name){
        var tmp = css.trim().split(name);
        if (tmp.length>1){
            return tmp[tmp.length-1].substr(1,23);
        }
        else{
            return "";
        }
    }

    socket.on('nickcolor',function(data){
        //seperate the 3 color values
        var r = data.toString().substr(0,3);
        var g = data.toString().substr(3,3);
        var b = data.toString().substr(6,3);

        //TODO: Check color values are between 0-255

        var rgb="rgb(" + r+ "," + g + "," + b + ")";
        css=css+"."+socket.username+"{color: "+rgb+";}";

        io.emit('cssUpdate', css);
        var usercolor = getUsercolor(socket.username);
        socket.emit('saveCookie',{username: socket.username, color: usercolor});
    });
});


