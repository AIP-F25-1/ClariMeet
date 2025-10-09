from pydantic import BaseModel

class IngestReq(BaseModel):
    meeting_id: str
    ts_ms: int
    source: str = "whiteboard.png"
    frame_b64: str

class IngestResp(BaseModel):
    snapshot: bool
    snapshot_path: str | None = None
