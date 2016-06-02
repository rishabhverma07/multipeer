var express= require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io').listen(http);
var fs= require('fs');
var bodyParser = require('body-parser');
var ejs = require('ejs');

app.set('view engine', 'ejs');  


//app.use(bodyParser());
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 


app.get('/', function(req, res){
  // The form's action is '/' and its method is 'POST',
  // so the `app.post('/', ...` route will receive the
  // result of our form
  var html = '<link rel="stylesheet" href="w3.css" />'+
  '<form class="w3-center w3-quarter w3-card-4" style="position:absolute;margin-top:10%;margin-left:35%;"  action="/" method="post">' +
               '<div class="w3-container w3-margin"><label class="w3-text-blue"><b>Enter your username:</b></label>' +
               '<input class="w3-input w3-border" type="text" name="userName" placeholder="username" />' +
               '<br/><br/>' +
			   '<label class="w3-text-blue"><b>Enter your Room:</b></label>' +
               '<input class="w3-input w3-border" type="text" name="room" placeholder="room.." />' +
               '<br/><br/>' +
               '<button class="w3-btn w3-blue w3-margin-bottom" type="submit">Submit</button>' +
   '</div></form>';
               
  res.send(html);
});


app.post('/',function(request,response){
	//var html = '<script>var user="'+request.body.userName+'"; var room="'+request.body.room+'" ;</script>';
	//response.send(html);
	//response.sendFile(__dirname+'/index.html');
	/*fs.readFile(__dirname+'/index.html',function(error,contents){
		if(error) console.log(error);
		console.log('reading..');
		html+=contents;
		console.log(contents);
	});*/
	var html ="";
	ejs.renderFile(__dirname+'/index.html',{"user":request.body.userName,"room":request.body.room}, function(err, str){
		// str => Rendered HTML string 
		html=str;
	});
	response.send(html);
	response.end();
});

app.use(express.static(__dirname));

http.listen(8888, function(){
  console.log('listening on *:8888');
});


var usernames= {};

var rooms ={};

io.sockets.on('connection',function(socket){
	console.log('a user connected: '+socket);
	
	socket.on('addUser',function(username,room){
		console.log('Adding user'+username);
		socket.username=username;
		socket.room=room;
		usernames[username]=socket;
		socket.join(room);
		if(!rooms[room])
			rooms[room]={};
		rooms[room][username]=username;
		// tell client that it is now connected
		socket.emit('updateChat','SERVER','You are now connected to room: '+socket.room);
		//tell all other members of the room
		socket.broadcast.to(socket.room).emit('updateChat','SERVER',socket.username+' has join the room: '+socket.room);
		// 
		socket.broadcast.to(socket.room).emit('updateUsers',Object.keys(rooms[room]),username);
		socket.emit('updateUsers',Object.keys(rooms[room]),username);
	});
	
	socket.on('chatMessage',function(data){
		socket.broadcast.to(socket.room).emit('updateChat',socket.username,data);
		console.log(socket.room+' : data is '+data+" user:"+socket.username);
	});
	
	socket.on('disconnect',function(){
		console.log('deleting');
		delete usernames[socket.username];
		delete rooms[socket.room][socket.username];
		socket.broadcast.to(socket.room).emit('updateUsers',Object.keys(rooms[socket.room]),"");
		socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username+' has left this room');
		socket.leave(socket.room);
	});
	
	socket.on('chat message', function(msg){
		var signal = JSON.parse(msg);
		var to = signal.choosed;
		console.log("Received: " + msg +" to be send to: "+signal.choosed);
		signal.choosed=socket.username;
		console.log('Now sending to: '+to+" choosing: "+signal.choosed);
		msg = JSON.stringify(signal);
		
		usernames[to].emit('chat message', msg);
  });

});