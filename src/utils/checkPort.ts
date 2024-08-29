import net from 'net';

export const checkPort = (port: number, host: string = '127.0.0.1'): Promise<void> => {
    return new Promise((resolve, reject) => {
        const server = net.createServer();

        server.once('error', (err: NodeJS.ErrnoException) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`Port ${port} is already in use`);
                reject(new Error(`Port ${port} is already in use`));
            } else {
                reject(err);
            }
        });

        server.once('listening', () => {
            server.close();
            resolve();
        });

        server.listen(port, host);
    });
};
