const WebSocket = require('ws');
const uuid = require("uuid");
const ws = new WebSocket.Server({ port: 3000 });

let waiting_player = null;
// let waiting_id = null;
// let idToSocket = {};
let socketToId = {};
ws.on("connection", (socket) => {
    // console.log(socket);
    console.log("connected");
    // socket.on("close", () => {
    //     // cnt--
    // });
    const id = uuid.v4();

    socket.send(JSON.stringify({
        type: "init",
        id
    }))

    if (waiting_player == null) {
        waiting_player = socket;
        socketToId[socket] = id;
        // idToSocket[id] = socket;
    }
    else {
        const random = Math.random();
        const result = Math.round(random);

        waiting_player.send(JSON.stringify({
            type: "opponent found",
            opponentId: id,
            color: result == 1 ? "black" : "red"
        }));

        socket.send(JSON.stringify({
            type: "opponent found",
            opponentId: socketToId[waiting_player],
            color: result == 1 ? "red" : "black"
        }));

        console.log(socketToId[waiting_player], id)

        socketToId[socket] = id;
        // idToSocket[id] = socket;

        waiting_player = null;
    }

    socket.on("message", (data) => {
        const dataSend = JSON.stringify(JSON.parse(data))
        console.log(dataSend);
        ws.clients.forEach((client) => {
            client.send(dataSend);
        });
    });

    socket.on("close", () => {
        // const id = socketToId[socket];
        delete socketToId[socket];
        // delete idToSocket[id];
    })
})

// players = {}
// let cnt = 0;
// const mapSocket = {};
// ws.on("connection", (socket) => {
//     console.log("connected");
//     cnt++;
//     socket.on("close", () => {
//         cnt--
//     });
//     map[socket] = 10;

//     let i = 0;
//     if (cnt >= 2) {
//         ws.clients.forEach((client) => {
//             if (i % 2 == 0) client.send(JSON.stringify({
//                 type: "init",
//                 color: "red"
//             }));
//             else client.send(JSON.stringify({
//                 type: "init",
//                 color: "black"
//             }));
//             i++;
//         });
//     }

//     socket.on("message", (data) => {
//         const dataSend = JSON.stringify(JSON.parse(data))
//         console.log(dataSend);
//         ws.clients.forEach((client) => {
//             client.send(dataSend);
//         });
//     })
// })

