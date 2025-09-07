---
{"dg-publish":true,"permalink":"/published/supervisor-bot-v1-prototype/","noteIcon":""}
---

This prototype explores the potential of a LLM to act as a supervisor, by adopting a 'persona' and listening to conversations between the student (me) and my supervisors, acting as an additional supervisor offering feedback.  

It will allow a local LLM to observe conversations and respond with helpful context, using voice (maybe) and text.  

It does not aim to have an interface and won't be a fully robust usable application at this stage.

[[published/llm-supervisor-v1-progress\|llm-supervisor-v1-progress]]

v1 - basic audio transcription loop
v1.5 - live mic input

[[published/supervisor-persona\|supervisor-persona]]

from initial tests and work on this, I believe that the persona is too 'formal' at the moment, sounds very much like a bot and I think this might be jarring and weird in my supervisory meeting context (as I don't have that kind of very formal relationship with them, though obviously the context is still formal)

more thoughts from v1 prototype testing, the art of conversation is not so easy to mimc and needs careful thought and design. Having now given the bot the context of my PhD, I am also becoming acutely aware of how much training, design and refining I need to do in order for this to be a useful tool - this is something to reflect on. I also wonder if there is a way that I can automate a training somehow that it might keep learning/ be aware of core things without so much work and design all of the time. I may need to keep logs of specific thing and use that as training data/prompts/context - this is something to further explore.