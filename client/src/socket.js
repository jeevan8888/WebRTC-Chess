import { io } from 'socket.io-client';


const options = {
    'force new connection': true,
    reconnectionAttempt: 'Infinity',
    timeout: 10000,
    transports: ['websocket'],
};


let socketInstance;

 export const getSocketInstance= ()=> {
    if (!socketInstance) {
        socketInstance = io(process.env.REACT_APP_BACKEND_URL,options);
    }
    return socketInstance;
}


