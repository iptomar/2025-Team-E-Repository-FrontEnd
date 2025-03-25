import {io} from 'socket.io-client';

const createWebSocketClient = () => {
    // Initializa o Socket.Io do lado client e config
    // O VITE obtém o URL do WebSocket por variavel no env
    // a variavel vai apontar para o URL do servidor
    const socket = io(import.meta.env.VITE_WS_URL, {
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 3000,
    });

    // retorno dos metodos do socket
    return{
        connect: () => socket.connect(),
        disconnect: () => socket.disconnect(),
        on: (event, callback) => socket.on(event, callback),
        emit: (event, data) => socket.emit(event, data),
        getSocket: () => socket,
        off: (event, callback) => socket.off(event,callback),
    };
};

const wsClient = createWebSocketClient();
export default wsClient;