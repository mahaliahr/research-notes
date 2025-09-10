---
{"dg-publish":true,"permalink":"/published/supervisor-bot-v1-prototype/","noteIcon":""}
---

This prototype explores the potential of a Large Language Model to act as a supervisor, by adopting a 'persona'[^1] and listening to conversations between the student (me) and my supervisors, acting as an additional supervisor offering feedback.  

It will allow a local LLM to observe conversations and respond with helpful context, using voice (maybe) and text.  

It does not aim to have an interface and won't be a fully robust usable application at this stage.

-

[^1]see: [[published/supervisor-persona\|supervisor-persona]]

---
<iframe width="560" height="315" src="https://www.youtube.com/embed/-u7upKWpRsI?si=94iSf2gUuIRT5POU" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

Notes from testing:

From initial tests and development work on this, I believe that the persona is too 'formal' at the moment, sounds very much like a bot and I think this might be jarring and weird in my supervisory meeting context (as I don't have that kind of very formal relationship with them, though obviously the context is still formal)

![alt text](/img/user/images/formal-example.png)

 The art of conversation is not so easy to mimc and needs careful thought and design. Having now given the bot the context of my PhD, I am also becoming acutely aware of how much training, design and refining I need to do in order for this to be a useful tool - this is something to reflect on. I also wonder if there is a way that I can automate a training somehow that it might keep learning/ be aware of core things without so much work and design all of the time. I may need to keep logs of specific things and use that as training data/prompts/context - this is something to further explore.

Also it feels slow, I need to give some kind of visual cue, to indicate processing or 'thinking' is happening. I also need to try optimising either with the LLM models I am using or Whisper which is doing the speech to text processing (there are a number of options to explore here).
*(follow up- this has been actioned in v1, a more sophisticated and developed solution to this can be implemented for v2).*