import { useEffect, useState } from 'react';
import wsClient from './client';

export const useWebSocket = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [latestMessage, setLatestMessage] = useState(null);


    useEffect(() => {
        const handleConnect = () => setIsConnected(true);
        const handleDisconnect = () => setIsConnected(false);
        const handleMessage = (msg) => setLatestMessage(msg);
        
        // Conecta quando o hook está configurado
        wsClient.connect()

        wsClient.on('connect', handleConnect);
        wsClient.on('disconnect', handleDisconnect)
        wsClient.on('message',handleMessage);

        return () => {
            wsClient.off('connect', handleConnect);
            wsClient.off('disconnect', handleDisconnect);
            wsClient.off('message', handleMessage);
            wsClient.disconnect();
        };
    }, []);

    return {
        isConnected,
        latestMessage,
        sendMessage: wsClient.emit,
        socket: wsClient.getSocket(),
    };
};