import os
import asyncio
import logging
from groq import AsyncGroq
from app.config import settings

logger = logging.getLogger(__name__)

async def transcribe_audio(meeting_id: str, audio_path: str):
    """
    Transcribes the WebM audio using Groq Whisper API.
    """
    logger.info(f"Starting API transcription for {audio_path}...")
    try:
        import requests
        requests.patch(f"http://127.0.0.1:3001/api/v1/meetings/{meeting_id}/internal-update", json={"status": "Processing"}, timeout=5)
        logger.info(f"Updated meeting {meeting_id} status to 'Processing'")
    except Exception as e:
        logger.warning(f"Could not update status to Processing: {e}")

    transcript_path = os.path.join(settings.TRANSCRIPTS_DIR, f"transcript_{meeting_id}.txt")
    
    # Check if audio file exists and has size
    if not os.path.exists(audio_path) or os.path.getsize(audio_path) == 0:
        logger.error("Audio file is missing or empty.")
        return

    try:
        # Initialize AsyncGroq client
        if not settings.GROQ_API_KEY:
            logger.error("GROQ_API_KEY is not set in environment or config.")
            return
            
        client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        
        logger.info("Uploading audio to Groq Whisper API...")
        # Groq requires file object
        with open(audio_path, "rb") as audio_file:
            # We request verbose_json to get timestamps
            transcription = await client.audio.transcriptions.create(
                model=settings.WHISPER_MODEL,
                file=audio_file,
                response_format="verbose_json"
            )
        
        logger.info("Transcription received from Groq API.")
        
        transcript_text = ""
        # Verbose JSON from OpenAI includes 'segments'
        if hasattr(transcription, 'segments') and transcription.segments:
            for segment in transcription.segments:
                # Use dictionary access if it's parsed as dict, or attribute access if object
                start = segment.start if hasattr(segment, 'start') else segment['start']
                end = segment.end if hasattr(segment, 'end') else segment['end']
                text = segment.text if hasattr(segment, 'text') else segment['text']
                
                line = f"[{start:.2f}s -> {end:.2f}s] {text}\n"
                logger.info(f"{line.strip()}")
                transcript_text += line
        else:
            # Fallback if no segments are returned
            text = transcription.text if hasattr(transcription, 'text') else getattr(transcription, 'text', str(transcription))
            transcript_text = text
            
        with open(transcript_path, "w", encoding="utf-8") as f:
            f.write(transcript_text)
            
        logger.info(f"Transcription complete. Saved to {transcript_path}")
        
        # Trigger RAG indexing here
        from app.rag.pipeline import index_transcript
        await index_transcript(meeting_id, transcript_path)

    except Exception as e:
        logger.error(f"Error during transcription: {e}")
