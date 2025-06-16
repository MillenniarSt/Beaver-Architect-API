#include <arpa/inet.h>
#include <netinet/in.h>
#include <sys/socket.h>
#include <unistd.h>
#include <cstring>
#include <iostream>
#include <vector>

// Funzione di utilità: legge esattamente n byte da fd
bool readNBytes(int fd, void* buffer, size_t n) {
    size_t total = 0;
    while (total < n) {
        ssize_t r = read(fd, (char*)buffer + total, n - total);
        if (r <= 0) return false;
        total += r;
    }
    return true;
}

// Funzione di utilità: scrive esattamente n byte su fd
bool writeNBytes(int fd, const void* buffer, size_t n) {
    size_t total = 0;
    while (total < n) {
        ssize_t w = write(fd, (char*)buffer + total, n - total);
        if (w <= 0) return false;
        total += w;
    }
    return true;
}

// Supponiamo che il chunk sia un array di 16x16 di int (es. altezza)
// In uno scenario reale potresti avere un array di blocchi 3D, ma manteniamo semplice.
using ChunkData = std::array<int16_t, 16*16>;

// Questa è la tua “funzione di generazione” in C++ (mock)
ChunkData generateChunk(int x, int z) {
    ChunkData data;
    for (int i = 0; i < 16*16; ++i) {
        data[i] = (int16_t)((x + z + i) % 256); // esempio banale
    }
    return data;
}

int main() {
    const int PORT = 5555;
    int serverFd = socket(AF_INET, SOCK_STREAM, 0);
    if (serverFd < 0) {
        std::cerr << "Errore apertura socket\n";
        return 1;
    }

    sockaddr_in addr{};
    addr.sin_family = AF_INET;
    addr.sin_port = htons(PORT);
    addr.sin_addr.s_addr = INADDR_ANY;

    int opt = 1;
    setsockopt(serverFd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));
    if (bind(serverFd, (sockaddr*)&addr, sizeof(addr)) < 0) {
        std::cerr << "Bind fallito\n";
        close(serverFd);
        return 1;
    }

    if (listen(serverFd, 10) < 0) {
        std::cerr << "Listen fallita\n";
        close(serverFd);
        return 1;
    }
    std::cout << "Server in ascolto su porta " << PORT << "\n";

    while (true) {
        int clientFd = accept(serverFd, nullptr, nullptr);
        if (clientFd < 0) {
            std::cerr << "Accept fallita\n";
            continue;
        }

        // Qui, per semplicità, gestiamo una singola connessione in modo sequenziale.
        // In un caso reale apri un thread o un pool di thread per ogni client
        std::cout << "Nuova connessione accettata\n";

        while (true) {
            // 1) Leggi 8 byte (x e z come big-endian di Java)
            uint8_t header[8];
            if (!readNBytes(clientFd, header, 8)) {
                std::cout << "Connessione chiusa dal client\n";
                break;
            }
            // Java invia big-endian, quindi:
            int32_t x = (header[0] << 24) | (header[1] << 16) | (header[2] << 8) | header[3];
            int32_t z = (header[4] << 24) | (header[5] << 16) | (header[6] << 8) | header[7];

            // 2) Genera il chunk
            auto chunk = generateChunk(x, z);

            // 3) Prepara la risposta: payloadSize + dati chunk
            int32_t payloadSize = sizeof(int16_t) * (16*16); // 512 bytes
            // Scrivi payloadSize in big-endian (per coerenza con Java)
            uint8_t sizeBuf[4];
            sizeBuf[0] = (payloadSize >> 24) & 0xFF;
            sizeBuf[1] = (payloadSize >> 16) & 0xFF;
            sizeBuf[2] = (payloadSize >> 8) & 0xFF;
            sizeBuf[3] = (payloadSize & 0xFF);
            if (!writeNBytes(clientFd, sizeBuf, 4)) break;

            // Ora invia tutti i 512 byte di chunk (int16_t in big-endian)
            for (int i = 0; i < 16*16; ++i) {
                int16_t v = chunk[i];
                uint8_t two[2];
                two[0] = (v >> 8) & 0xFF;
                two[1] = v & 0xFF;
                if (!writeNBytes(clientFd, two, 2)) { break; }
            }
            // Alla fine di questa scrittura, il client Java può leggere i dati.
        }

        close(clientFd);
    }

    close(serverFd);
    return 0;
}