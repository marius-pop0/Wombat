// shorthand for $(document).ready(...)
$(function() {
    var socket = io();

    var $message = $('#message');
    var $publicChat = $('#publicChat');
    var $publicUsers = $('#publicUsers');
    var $MyUsername = $('#MyUsername');

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
        $publicChat.append('<li>'+data.time+' <strong class="'+data.user+'">'+data.user+': </strong>'+data.msg+'</li>');
        $publicChat.animation({scrollTop: $(this).height},"fast");
    });

    socket.on('update users', function(data){
        html='';
        for(i=0;i<data.length;i++){
            html=html+"<tr> <td class=\"col-xs-8\">"+data[i]+"</td> </tr>";

        }
        $publicUsers.html(html);
    });

    socket.on('update username',function(data){
        $MyUsername.html('You are '+data.toString());
    });
    socket.on('cssUpdate', function(data){
        var sheet = document.createElement('style');
        sheet.innerHTML=data;
        document.body.appendChild(sheet);
    });
    socket.on('saveCookie',function(data){
        //cookie save on disconnect
        var d = new Date();
        d.setTime(d.getTime() + (24*60*60*1000));//24hours
        var expires = "expires="+ d.toUTCString();

        cookieString = "cook="+data.username+"."+data.color+";"+expires+";";
        document.cookie=cookieString;

    });

});
