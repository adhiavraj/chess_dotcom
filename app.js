const express = require('express');
const socket = require('socket.io');
const http = require('http');
const { Chess } = require('chess.js');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players = {};

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, "public")));

app.get('/', function (req, res) {
    res.render('index');
});

io.on("connection", (socket) => {
    console.log("Connected to a user");

    if (!players.white) {
        players.white = socket.id;
        socket.emit("playerRole", "w");
    } else if (!players.black) {
        players.black = socket.id;
        socket.emit("playerRole", "b");
    } else {
        socket.emit("spectatorRole");
    }

    socket.on("disconnect", () => {
        console.log("User disconnected");
        if (socket.id === players.white) {
            delete players.white;
        } else if (socket.id === players.black) {
            delete players.black;
        }
    });

    socket.on("move", (move) => {
        try {
            const turn = chess.turn();
            if ((turn === 'w' && socket.id !== players.white) || (turn === 'b' && socket.id !== players.black)) {
                return;
            }

            const result = chess.move(move);

            if (result) {
                io.emit("move", move);
                io.emit("boardState", chess.fen());
            } else {
                console.log("Invalid move!", move);
                socket.emit("invalidMove", move);
            }
        } catch (error) {
            socket.emit("error", error.message);
            console.log(error);
        }
    });
});

server.listen(3000, () => {
    console.log(`Server is listening on http://localhost:3000`);
});