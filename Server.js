const path = require ('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const {genrateMassage} = require('./utils/message')
const { addUser , getUser} = require('./utils/users')
const app = express()
const mysql = require('mysql');
const server = http.createServer(app)
const io = socketio(server)
const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')
app.use(express.static(publicDirectoryPath))
io.on('connection', (socket) => {
    console.log('New WebSocket connection')
    socket.on('join' , (Option,callback) => {
        const { error , user } = addUser({ id:socket.id, ...Option})
        if (error){
            return callback (error)
        }
        socket.join(user.room)
        socket.emit('message' , genrateMassage('admin' , 'Welcome!'))
        socket.broadcast.to(user.room).emit('message' , genrateMassage('Admin' , '${user.username} has joind!'))
        io.to(user.room).emit('roomData' , {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })
    socket.on('sendMessage' , (message, callback)=> {
        const user = getUser(socket.id)
        const filter = new filter()
        if(filter.isProfane(message)){
            return callback ('Profany is not allowed!')
        }
        io.to(user.room).emit('message',genrateMassage(user.username, message))
        callback()
    })
    socket.on('disconnect' , ()=>{
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message' , genrateMassage('Admin' , '${user.username} has left!'))
            io.to(user.room).emit('roomData' , {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})
server.listen(port, () => {
    console.log('server is up on port ${port}!')
})

const connection = mysql.createConnection({
    host : 'localhost',
    user : 'root',
    password : '',
    database : 'web chat'
});
connection.connect(function (error) {
});
// save message in my sql
socket.on("new_message", function (data) {
	console.log("Client says", data);

	connection.query("INSERT INTO messages (message) VALUES ('" + data + "')", function (error, result) {
		
		io.emit("new_message", {
			id: result.insertId,
			message: data
		});
	});
});
