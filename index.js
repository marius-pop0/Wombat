var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
var connections = [];
var users = [];
var css="";

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
    socket.username=user;
    users.push(user);

    socket.emit('update username',socket.username);
    io.emit('cssUpdate', css);
    var usercolor = getUsercolor(socket.username);
    socket.emit('saveCookie',{username: socket.username, color: usercolor});
    updateConnectedUsers();
    console.log('Connected users %s',users);



    socket.on('disconnect',function(data){
        if (!socket.username) return;

        //remove username from active list
        users.splice(users.indexOf(socket.username),1);
        updateConnectedUsers();
        connections.splice(connections.indexOf(socket),1);
        console.log('Disconnected: %s sockets connected', connections.length);
    });

    socket.on('chat', function(data){
        var timeNow = new Date().toLocaleTimeString();
        io.emit('chat', {msg: data, user: socket.username, time: timeNow});
    });

    //New User
    socket.on('new users',function(data){

        users.splice(users.indexOf(socket.username),1);

        socket.username = data;
        if(users.indexOf(data)===-1) {
            users.push(socket.username);
            console.log('Connected users %s',users);

            socket.emit('update username',socket.username);
            var usercolor = getUsercolor(socket.username);
            socket.emit('saveCookie',{username: socket.username, color: usercolor});
        }
        else{
            console.log('usersname taken')
        }
        updateConnectedUsers()
    });
    
    function updateConnectedUsers() {
        io.emit('update users', users);
    }
    function getUsercolor(name){
        var tmp = css.trim().split(name);
        console.log(tmp[tmp.length-1]);

        return "red";
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


