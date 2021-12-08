const express = require('express')
const {Server} = require("socket.io")
const http = require('http')
const app = express()
const server = http.createServer(app)
const io = new Server(server)

const timers = new Array(4)

class Timer {
	counted = 0
	interval
	position = 0
	
	constructor(position, title, down) {
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
		this.counted = 0
	}
	
	stop() {
		clearInterval(this.interval)
	}
	
	toJSON() {
		return {
			position: this.position,
			title: this.title,
			counted: this.counted
		}
	}
}

app.use(express.static('web'))

io.on("connection", (socket) => {
	socket.emit('init', timers)
	
	socket.on("set", ({index, title, down}) => {
		if(timers[index])
			timers[index].stop()
		timers[index] = new Timer(index, title, down)
		timers[index].start()
		socket.emit('init', timers.map(x => x.toJSON()))
	})
	
	socket.on("start", (position) => {
		timers[position].start()
		socket.emit('init', timers.map(x => x.toJSON()))
	})
	
	socket.on("stop", (position) => {
		timers[position].stop()
		socket.emit('init', timers.map(x => x.toJSON()))
	})
	
	socket.on("reset", (position) => {
		timers[position].reset()
		socket.emit('init', timers.map(x => x.toJSON()))
	})
})

const port = Number(process.env.PORT) || 8080
server.listen(port, () => console.log(`Listening on port ${port}`))