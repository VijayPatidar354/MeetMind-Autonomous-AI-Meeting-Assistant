import asyncio
import os
import base64
import logging
from playwright.async_api import async_playwright
import traceback
import requests
from app.config import settings

logger = logging.getLogger(__name__)

def run_bot_in_thread(meeting_id: str, meeting_link: str):
    """Wrapper to run the async Playwright bot in a separate thread with a clean event loop."""
    import sys
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(join_and_record_meeting(meeting_id, meeting_link))
    finally:
        loop.close()

# JS Script injected before page load to monkey-patch WebRTC and intercept audio tracks
WEBRTC_INTERCEPT_JS = """
    window.recordedAudioChunks = [];
    window.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    window.dest = window.audioCtx.createMediaStreamDestination();
    
    // Start MediaRecorder immediately on the empty stream so we always get a valid file
    window.mediaRecorder = new MediaRecorder(window.dest.stream, { mimeType: 'audio/webm' });
    window.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            const reader = new FileReader();
            reader.readAsDataURL(event.data);
            reader.onloadend = () => {
                window.recordedAudioChunks.push(reader.result);
            };
        }
    };
    window.mediaRecorder.start(2000);
    console.log("WebRTC Audio recording started (baseline).");

    const origSetRemoteDescription = RTCPeerConnection.prototype.setRemoteDescription;
    RTCPeerConnection.prototype.setRemoteDescription = function() {
        this.addEventListener('track', (e) => {
            if (e.track.kind === 'audio') {
                console.log("Intercepted incoming WebRTC audio track!");
                // Create a stream from the incoming track and route it to our recorder
                const stream = new MediaStream([e.track]);
                const source = window.audioCtx.createMediaStreamSource(stream);
                source.connect(window.dest);
                // Play it through the local speakers so you can hear it too
                source.connect(window.audioCtx.destination); 
            }
        });
        return origSetRemoteDescription.apply(this, arguments);
    };
"""

async def get_participant_count(page):
    """Attempt to get the participant count from the page DOM."""
    return await page.evaluate("""
        () => {
            const countEl = document.querySelector('.uGOf1d');
            if (countEl) {
                const count = parseInt(countEl.innerText);
                if (!isNaN(count)) return count;
            }
            
            // Strategy 2: Look for elements with people/participants aria labels
            const peopleLabels = document.querySelectorAll('[aria-label*="Show everyone"], [aria-label*="people" i], [aria-label*="participants" i]');
            for (let el of peopleLabels) {
                let text = el.innerText || el.getAttribute('aria-label') || "";
                let match = text.match(/\\d+/);
                if (match) return parseInt(match[0]);
            }
            
            // Strategy 3: Count participant tile attributes
            const tiles = document.querySelectorAll('[data-participant-id]');
            if (tiles.length > 0) return tiles.length;

            return null;
        }
    """)

async def join_and_record_meeting(meeting_id: str, meeting_link: str):
    """
    Playwright bot to join the meeting, mute mic/cam, and record system audio using WASAPI loopback.
    """
    logger.info(f"Starting bot for meeting {meeting_id} at {meeting_link}")
    
    audio_path = os.path.join(settings.RECORDINGS_DIR, f"meeting_{meeting_id}.wav")
    
    # Initialize the System Audio Recorder
    from app.audio.recorder import SystemAudioRecorder
    recorder = SystemAudioRecorder(output_path=audio_path)

    try:
        async with async_playwright() as p:
            # Launch persistent context to use the saved Google Login
            context = await p.chromium.launch_persistent_context(
                user_data_dir=settings.GOOGLE_PROFILE_DIR,
                headless=False, # Show browser so user can debug
                args=[
                    '--use-fake-ui-for-media-stream',
                    '--use-fake-device-for-media-stream',
                    '--disable-blink-features=AutomationControlled',
                    '--autoplay-policy=no-user-gesture-required'
                ],
                permissions=['camera', 'microphone']
            )
            
            page = await context.new_page()
            
            logger.info(f"Navigating to {meeting_link}...")
            await page.goto(meeting_link)
            
            logger.info("Waiting for Join button or Guest Name input...")
            try:
                # First, check if we need to enter a name as a guest (extremely broad text input lookup)
                name_input = page.locator("input[type='text']").first
                
                # We wait briefly to see if the name input appears
                try:
                    await name_input.wait_for(state="visible", timeout=5000)
                    logger.info("Guest mode detected. Entering bot name...")
                    await name_input.fill("AI Meeting Assistant")
                except:
                    pass # Not in guest mode or input didn't load, proceed to click join
                    
                # Now look for the join button using a robust regex search
                # This matches anything containing "Join now" or "Ask to join" (case insensitive)
                join_btn = page.locator("text=/Join now|Ask to join/i").first
                await join_btn.wait_for(state="visible", timeout=60000)
                await join_btn.click()
                logger.info("Clicked Join button.")
            except Exception as e:
                logger.warning(f"Could not find Join button automatically. Error: {e}")
            
            # Wait until the bot is actually admitted into the meeting by the host!
            logger.info("Waiting to be admitted into the meeting by the host...")
            try:
                # The "Leave call" button only appears once you are inside the actual meeting
                leave_btn = page.locator("[aria-label='Leave call'], [aria-label='Leave meeting']").first
                await leave_btn.wait_for(state="visible", timeout=300000) # Wait up to 5 minutes to be admitted
                logger.info("Successfully admitted into the meeting!")
            except Exception as e:
                logger.error("Timed out waiting to be admitted by the host.")
                await context.close()
                return
            
            # Give the meeting DOM a moment to fully render
            await asyncio.sleep(2)
            try:
                requests.patch(
                    f"http://127.0.0.1:3001/api/v1/meetings/{meeting_id}/internal-update",
                    json={"status": "Recording"},
                    timeout=5
                    )
            except Exception as e:
                logger.warning(f"Could not update status to Recording: {e}")
            logger.info("Starting System Audio Recording...")
            recorder.start()
            
            max_p_count = 0
            
            # Polling loop
            while True:
                await asyncio.sleep(5)
                        
                # Check participant count
                p_count = await get_participant_count(page)
                logger.info(f"Current participant count: {p_count}")
                
                if p_count is not None:
                    if p_count > max_p_count:
                        max_p_count = p_count
                    
                    # If it's just the bot left, BUT it previously saw other people (meeting started)
                    if p_count <= 1 and max_p_count > 1:
                        logger.info("Meeting has concluded (only 1 participant left). Exiting meeting...")
                        break
                
                # Also check if we were kicked out (e.g. "You've been removed from the meeting")
                is_removed = await page.locator("text=You've been removed").count()
                if is_removed > 0:
                    logger.info("Bot was removed from the meeting.")
                    break

            # Stop recording
            recorder.stop()
            logger.info(f"Meeting ended. Audio saved to {audio_path}")
            
            await context.close()
            
            # Trigger transcription step here
            from app.transcription.stt import transcribe_audio
            await transcribe_audio(meeting_id, audio_path)

    except Exception as e:
        logger.error(f"Fatal Error in bot: {str(e)}")
        logger.error(traceback.format_exc())
        # Ensure we stop recording if it crashed
        try:
            if hasattr(recorder, 'is_recording') and recorder.is_recording:
                recorder.stop()
        except:
            pass

if __name__ == "__main__":
    # Test script locally
    asyncio.run(join_and_record_meeting("test_123", "https://meet.google.com/your-meet-link"))
