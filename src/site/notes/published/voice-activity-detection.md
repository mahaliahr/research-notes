---
title: Voice Activity Detection
permalink: /notes/voice-activity-detection/
dg-publish: true
visibility: public
description: >-
  the system continuously listens to the mic, but only starts 'recording' when
  it detects speech, and stops when there’s silence for a certain duration.


  ---


  Wit
updated: '2025-09-07T19:15:31.055Z'
---
the system continuously listens to the mic, but only starts 'recording' when it detects speech, and stops when there’s silence for a certain duration.

---

Without VAD:
-  Wasted CPU/GPU transcribing long silences.
- Context window gets filled with “um… yeah… (5 seconds of silence)” instead of meaningful content.
-  Risk of producing huge files and high latency in processing.


With VAD:
- The bot reacts only to speech.
- Silences become natural 'breaks' for sending content to the LLM.
- You can better preserve meeting flow without constant interruptions.
---

can use a VAD library
