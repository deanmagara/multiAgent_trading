# backend/websocket_broadcast.py
active_connections = []

async def broadcast_signal(signal: dict):
    for connection in active_connections:
        try:
            await connection.send_json(signal)
        except Exception:
            active_connections.remove(connection)