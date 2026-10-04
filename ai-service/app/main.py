import logging
import sys
import asyncio
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from app.config import settings
from app.meeting_bot.bot import run_bot_in_thread
from app.rag.pipeline import query_transcript

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Meeting Intelligence AI Service")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MeetingDispatch(BaseModel):
    meeting_id: str
    meeting_link: str

class DispatchResponse(BaseModel):
    status: str
    meeting_id: str

class ChatQuery(BaseModel):
    meeting_id: str
    query: str

class ChatResponse(BaseModel):
    answer: str

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Python AI Service"}

@app.post("/bot/dispatch", response_model=DispatchResponse)
async def dispatch_bot(dispatch: MeetingDispatch, background_tasks: BackgroundTasks):
    try:
        logger.info(f"Dispatching bot for meeting {dispatch.meeting_id}")
        # Start the playwright bot in the background thread
        background_tasks.add_task(run_bot_in_thread, dispatch.meeting_id, dispatch.meeting_link)
        return {"status": "Bot dispatched successfully", "meeting_id": dispatch.meeting_id}
    except Exception as e:
        logger.error(f"Error dispatching bot: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat", response_model=ChatResponse)
async def chat_with_meeting(query: ChatQuery):
    try:
        logger.info(f"Received chat query for meeting {query.meeting_id}: {query.query}")
        answer = await query_transcript(query.meeting_id, query.query)
        return {"answer": answer}
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
