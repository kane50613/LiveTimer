const express = require('express')
const {Server} = require("socket.io")
const http = require('http')
const app = express()
const server = http.createServer(app)
const io = new Server(server)

const timers = new Array(4)
const password = process.env.PASSWORD ||
	new Array(5).fill(0).map(() => Math.floor(Math.random() * 10)).join('')

class Timer {
	_started = 0
	counted = 0
	interval
	position = 0
	
	constructor(position, title, down) {
		this._started = down
		this.counted = down
		this.position = position
		this.title = title
	}
	
	start() {
		if(this.interval)
			this.stop()
		this.interval = setInterval(() => {
			if(this.counted <= 0)
				return this.stop()
			this.counted--
			io.emit('timer', this.toJSON())
		}, 1000)
	}
	
	reset() {
		clearInterval(this.interval)
		this.interval = null
		this.counted = this._started ?? 0
	}
	
	stop() {
		clearInterval(this.interval)
		this.interval = null
	}
	
	toJSON() {
		return {
			position: this.position,
			title: this.title,
			counted: this.counted,
			paused: this.paused
		}
	}
	
	get paused() {
		return !this.interval
	}
}

app.use(express.static('web'))

io.on("connection", (socket) => {
	if(socket.handshake.auth) {
		if(socket.handshake.auth.toString() !== password)
			return socket.disconnect()
		
		socket._authed = true
	}
	
	socket.emit('init', timers)
	
	socket.on("set", ({index, title, down}) => {
		if(!socket._authed)
			return
		if(timers[index])
			timers[index].stop()
		timers[index] = new Timer(index, title, down)
		io.emit('init', timers.map(x => x?.toJSON()))
	})
	
	socket.on("start", (position) => {
		if(!socket._authed)
			return
		if(!timers[position].paused)
			return
		timers[position].start()
		socket.emit('init', timers.map(x => x?.toJSON()))
	})
	
	socket.on("stop", (position) => {
		if(!socket._authed)
			return
		if(timers[position].paused)
			return
		timers[position].stop()
		io.emit('init', timers.map(x => x?.toJSON()))
	})
	
	socket.on("reset", (position) => {
		if(!socket._authed)
			return
		timers[position].reset()
		io.emit('init', timers.map(x => x?.toJSON()))
	})
	
	socket.on("clear", (position) => {
		if(!socket._authed)
			return
		delete timers[position]
		io.emit('init', timers.map(x => x?.toJSON()))
	})
})

const port = Number(process.env.PORT) || 8080
server.listen(port, () => console.log(`Listening on port ${port}, password is: ${password}`))