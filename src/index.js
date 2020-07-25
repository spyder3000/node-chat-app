const path = require('path');   // core node module (nodejs.org);  do not need to install via npm i xxx on cmd prompt 
const http = require('http');   
const express = require('express'); 
const socketio = require('socket.io'); 
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express();   // creates a new express application 
const server = http.createServer(app);   // this line is new;  this is needed for express to work with socket.io  

// this will configure socket.io to work with a given server;  'server' param needs to be the raw http server (app would not work here) 
const io = socketio(server);   
const port = process.env.PORT || 3000               // process.env.PORT will come from Heroku for production

// DEfine paths for Express config;  __dirname is path to current directory;  path.join to go up one level & into public dir;  
const publicDirectoryPath = path.join(__dirname, '../public');  // this line will match to public files first (e.g. index.html) prior to app.get stmts below  

// Setup static directory;  app.use to customize our server;  
app.use(express.static(publicDirectoryPath))   

// server (emit) -> client (receive) -- acknowledgement -> server
// client (emit) -> server (receive) -- acknowledgement -> client

/* this is socket on the server;  io.con() is only used for connection  */
io.on('connection', (socket) => {   // connection will fire when socket.io gets a new connection
    console.log('New websocket connection');  // note:  if there are 5 clients, this will run 5 times (1 for each connection) 
    /*socket.emit('message', {        // emits to just a single connection
        text: 'Welcome!', 
        createdAt: new Date().getTime()
    });*/
    //socket.emit('message', generateMessage('Welcome!'))  
    //socket.broadcast.emit('message', generateMessage('A new user has joined'));  // emits to everyone except the client sender 

    socket.on('join', ({ username, room}, callback) => {
        // destructured return will return either an error object or a user object;  note that addUser does some reformatting, to that room 
        //    may be different from user.room -- use user.room below to ensure trim & all lowercase 
        const { error, user } = addUser({ id: socket.id, username, room })   // socket.id is from socket object, it is a unique identifier for that particular connection 

        if (error) {
            return callback(error); 
        }

        socket.join(user.room)   // socket.join can only be used on the server

        socket.emit('message', generateMessage(user.username, 'Welcome!'))  
        socket.broadcast.to(user.room).emit('message', generateMessage(user.username, `${user.username} has joined!`));  // emits to everyone in room except the client sender 

        // emits to everyone in room updated Users still in room 
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback();  // no params means no error;  

        // socket.emit, io.emit, socket.broadcast.emit (prev emits we've used)
        // io.to().emit -- [NEW] emits an event to everybody in a specific room;  
        // socket.broadcast.to().emit -- [NEW] broadcast to everybody in a specific room except for sender 
    })

    socket.on('sendMessage', (msg, callback) => {
        const user = getUser(socket.id)  

        const filter = new Filter(); 

        if (filter.isProfane(msg)) {
            return callback('Profanity not allowed')
        }
        // io.emit emits to every single connection available (e.g. mult sessions on localhost:3000)
        //io.emit('message', generateMessage(msg));      // all params after 1st (e.g. msg) provided to callback on client (chat.js)
        io.to(user.room).emit('message', generateMessage(user.username, msg));   // all params after 1st provided to callback on client (chat.js)
        callback();     // a basic acknowledgement that msg received;  can send string or object as return param
    })

    socket.on('sendLocation', (dat, callback) => {
        const user = getUser(socket.id)  
        // will send a URL link using Google Maps with params of lat, long;  all params after 1st provided to callback on client (chat.js)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${dat.latitude},${dat.longitude}`));   
        callback(); 
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)  // properties are user.username & user.room
        // logic to exclude people who tried joining a room & failed, then disconnected.  do not send a msg for these
        if (user) {
            io.to(user.room).emit('message', generateMessage(user.username, `${user.username} has left`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

//app.listen(port, () => {
server.listen(port, () => {     // modified from app.listen to server var, so that this will work with socket.io  
    console.log(`Server is up on port ${port}`); 
})