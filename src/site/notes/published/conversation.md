---
{"dg-publish":true,"permalink":"/published/conversation/","dgPassFrontmatter":true,"noteIcon":""}
---

1. ~~input capture
	- ~~text based input
		- ~~shared doc
		- ~~use [[_unpublished/webhook\|webhook]] service to capture data and send to LLM
	- voice based input (speech to text tools)
		- [[_unpublished/whisper-stt\|whisper-stt]] 
		- [[_unpublished/vosk-stt\|vosk-stt]]
		- [[published/deepspeech-stt\|deepspeech-stt]] (no longer actively supported, but could fine-tune)
	- storing inputs
		- Use a local database (e.g., SQLite or PostgreSQL) to log conversations.
		- Implement a timestamped message queue to track dialogue progression
2. processing 
3. user interface

Real time interjections and interactions
[[_unpublished/voice-activity-detection\|voice-activity-detection]] (VAD)

[speaker-diarisation]