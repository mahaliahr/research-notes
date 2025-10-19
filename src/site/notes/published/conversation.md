---
dg-publish: true
permalink: /published/conversation/
noteIcon: ''
visibility: public
description: "1. ~~input capture\n\t- ~~text based input\n\t\t- ~~shared doc\n\t\t- ~~use unpublished/webhook\\ service to capture data and send to LLM\n\t- voice based input (speech to"
updated: '2025-10-15T21:01:34.005Z'
---

1. ~~input capture
	- ~~text based input
		- ~~shared doc
		- ~~use [[unpublished/webhook\|webhook]] service to capture data and send to LLM
	- voice based input (speech to text tools)
		- [[unpublished/whisper-stt\|whisper-stt]] 
		- [[unpublished/vosk-stt\|vosk-stt]]
		- [[published/deepspeech-stt\|deepspeech-stt]] (no longer actively supported, but could fine-tune)
	- storing inputs
		- Use a local database (e.g., SQLite or PostgreSQL) to log conversations.
		- Implement a timestamped message queue to track dialogue progression
2. processing 
3. user interface

Real time interjections and interactions
[[unpublished/voice-activity-detection\|voice-activity-detection]] (VAD)

[speaker-diarisation]
