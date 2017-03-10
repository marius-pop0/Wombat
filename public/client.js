// shorthand for $(document).ready(...)
$(function() {
    var socket = io();

    var $message = $('#message');
    var $publicChat = $('#publicChat');
    var $publicUsers = $('#publicUsers');
    var $MyUsername = $('#MyUsername');
    var clientUsername="";

    $('form').submit(function(){
        var string = $message.val();
        if(string.toString().substr(0,6)==="/nick "){
            var user = string.toString().substring(6).split(' ');
            socket.emit('new users', user[0]);
        }
        else if(string.toString().substr(0,11)==="/nickcolor "){
            var color = string.toString().substring(11);
            socket.emit('nickcolor', color);
        }
        else{
            socket.emit('chat', $message.val());
        }
        $message.val('');
	    return false;
    });

    socket.on('chat', function(data){
        var txt="";
        var log="";
        if (data.user==clientUsername){
            txt='<tr><td>'+data.time+' <strong class="'+data.user+'">'+data.user+': </strong><b>'+data.msg+'</b></td></tr>';
            log='<tr><td>'+data.time+' <strong class="'+data.user+'">'+data.user+': </strong>'+data.msg+'</td></tr>';
        }
        else{
            txt='<tr><td>'+data.time+' <strong class="'+data.user+'">'+data.user+': </strong>'+data.msg+'</td></tr>';
            log='<tr><td>'+data.time+' <strong class="'+data.user+'">'+data.user+': </strong>'+data.msg+'</td></tr>';
        }
        $publicChat.append(txt);
        socket.emit('log',log);
        $publicChat.scrollTop($publicChat.height());
    });

    socket.on('sendHistory', function (data){
        for(i=0;i<data.length;i++) {
            $publicChat.append(data[i]);
        }
        $publicChat.scrollTop($publicChat.height());
    });

    socket.on('update users', function(data){
        html='';
        for(i=0;i<data.length;i++){
            html=html+"<tr> <td>"+data[i]+"</td> </tr>";
        }
        $publicUsers.html(html);
    });

    socket.on('update username',function(data){
        $MyUsername.html('You are '+data.toString());
        clientUsername = data.toString();
    });
    socket.on('cssUpdate', function(data){
        var sheet = document.createElement('style');
        sheet.innerHTML=data;
        document.body.appendChild(sheet);
    });
    socket.on('saveCookie',function(data){
        //cookie save
        var d = new Date();
        d.setTime(d.getTime() + (24*60*60*1000));//24hours expires
        var expires = "expires="+ d.toUTCString();

        cookieString = "cook="+data.username+"."+data.color+";"+expires+";";
        document.cookie=cookieString;

    });
    socket.on('getCookie',function (data) {
        var name = data + "=";
        var decodedCookie = decodeURIComponent(document.cookie);
        var ca = decodedCookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                socket.emit('cookie', c.substring(name.length, c.length));
            }
        }
    });

});
