import {
    log
} from "./log.js";
import {
    receive
} from "./receive.js";
const wshost = "wss://wab.sabae.cc";

let socket = new WebSocket(wshost);

export const socketSend = obj => socket.send(JSON.stringify(obj));
export const setupWs = pub => {
    socket.onopen = () => {
        log("socket opened");
        socketSend({
            type: "id", body: pub.x + pub.y
        });
    };
    socket.onmessage = e => receive(e, pub);
    socket.onclose = () => {
        log("socket closed");
        log("reconnecting to server");
        socket = new WebSocket(wshost);
        setupWs(pub);
    };
};