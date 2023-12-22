import {
    log
} from "./log.js";
import {
    receive
} from "./receive.js";
import{
    sendName
} from "./connect.js"
const wshost = "wss://wab.sabae.cc";

let socket;
const open = ()=> {
    socket = new WebSocket(wshost);
    socket.onopen = () => {
        log("socket opened");
        sendName();
    };
    socket.onmessage = receive;
    socket.onclose = () => {
        log("socket closed");
        log("reconnecting to server");
        open();
    };
};
open();
export const socketSend = obj => socket.send(JSON.stringify(obj));