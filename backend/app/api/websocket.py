"""
WebSocket API - Real-time agent progress updates.
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Set
import logging
import json

logger = logging.getLogger(__name__)

router = APIRouter(tags=["websocket"])


class ConnectionManager:
    """Manages WebSocket connections for real-time updates."""

    def __init__(self):
        # Map of project_id -> set of websocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, project_id: str):
        """Connect a websocket to a project's updates."""
        await websocket.accept()

        if project_id not in self.active_connections:
            self.active_connections[project_id] = set()

        self.active_connections[project_id].add(websocket)
        logger.info(f"WebSocket connected for project {project_id}")

    def disconnect(self, websocket: WebSocket, project_id: str):
        """Disconnect a websocket."""
        if project_id in self.active_connections:
            self.active_connections[project_id].discard(websocket)

            if not self.active_connections[project_id]:
                del self.active_connections[project_id]

        logger.info(f"WebSocket disconnected for project {project_id}")

    async def send_update(self, project_id: str, message: dict):
        """Send update to all connections listening to a project."""
        if project_id not in self.active_connections:
            return

        disconnected = set()

        for connection in self.active_connections[project_id]:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Failed to send WebSocket message: {e}")
                disconnected.add(connection)

        # Remove disconnected connections
        for connection in disconnected:
            self.active_connections[project_id].discard(connection)


# Global connection manager
manager = ConnectionManager()


@router.websocket("/ws/projects/{project_id}")
async def websocket_endpoint(websocket: WebSocket, project_id: str):
    """
    WebSocket endpoint for real-time agent progress updates.

    Clients connect to /ws/projects/{project_id} to receive updates
    as agents process the project.

    Message format:
    {
        "type": "agent_progress",
        "agent": "overview",
        "status": "started|completed|failed",
        "progress": 0-100,
        "message": "Status message",
        "timestamp": "2026-01-02T10:32:15Z"
    }
    """
    await manager.connect(websocket, project_id)

    try:
        while True:
            # Keep connection alive
            # Clients can send ping messages if needed
            data = await websocket.receive_text()

            if data == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        manager.disconnect(websocket, project_id)
    except Exception as e:
        logger.error(f"WebSocket error for project {project_id}: {e}")
        manager.disconnect(websocket, project_id)


async def send_agent_update(
    project_id: str,
    agent: str,
    status: str,
    progress: int,
    message: str = ""
):
    """
    Helper function to send agent progress update via WebSocket.

    Args:
        project_id: Project UUID
        agent: Agent type (overview, proposal, etc.)
        status: Status (started, completed, failed)
        progress: Progress percentage (0-100)
        message: Optional status message
    """
    from datetime import datetime

    update = {
        "type": "agent_progress",
        "agent": agent,
        "status": status,
        "progress": progress,
        "message": message,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

    await manager.send_update(project_id, update)
