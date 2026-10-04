import soundcard as sc
import soundfile as sf
import numpy as np
import threading
import logging
import os

logger = logging.getLogger(__name__)

class SystemAudioRecorder:
    def __init__(self, output_path, sample_rate=44100):
        self.output_path = output_path
        self.sample_rate = sample_rate
        self.is_recording = False
        self.audio_data = []
        self._thread = None

    def start(self):
        self.is_recording = True
        self._thread = threading.Thread(target=self._record_loop)
        self._thread.start()
        logger.info(f"System Audio Recorder started, saving to {self.output_path}")

    def stop(self):
        self.is_recording = False
        if self._thread:
            self._thread.join()
        
        if self.audio_data:
            # Flatten array
            final_audio = np.concatenate(self.audio_data, axis=0)
            os.makedirs(os.path.dirname(self.output_path), exist_ok=True)
            # Write out as WAV
            sf.write(self.output_path, final_audio, self.sample_rate)
            logger.info(f"System Audio Recorder saved successfully to {self.output_path}")
        else:
            logger.warning("No audio data was recorded!")

    def _record_loop(self):
        try:
            # Get the default speaker
            default_speaker = sc.default_speaker()
            
            # Request the microphone associated with the speaker's ID (this yields the WASAPI loopback)
            loopback_mic = sc.get_microphone(id=default_speaker.id, include_loopback=True)
            
            if not loopback_mic:
                logger.error("Could not find a WASAPI loopback device!")
                return
                
            logger.info(f"Recording using Loopback Device: {loopback_mic.name}")
            
            with loopback_mic.recorder(samplerate=self.sample_rate) as loop_rec:
                while self.is_recording:
                    # Record in 100ms chunks to keep the thread responsive to stop signals
                    chunk_frames = self.sample_rate // 10
                    # This blocks until chunk_frames are captured
                    loop_data = loop_rec.record(numframes=chunk_frames)
                    self.audio_data.append(loop_data)
                    
        except Exception as e:
            logger.error(f"System Audio Recording error: {e}")
