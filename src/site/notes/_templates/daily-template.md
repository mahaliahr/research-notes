---
dg-publish: true
visibility: public
title: <% tp.date.now('YYYY-MM-DD') %>
tags:
  - daily
  - stream
---

<!--
Daily note template (PhD-Live)

Stream line syntax:
- HH:MM something you did

Embedded session syntax (widget detects start:: anywhere):
start:: YYYY-MM-DD HH:MM
end:: YYYY-MM-DD HH:MM
topic:: short title

Milestone syntax (anywhere in any note):
- [ ] Do the thing #milestone @YYYY-MM-DD
- [x] Done thing #milestone @YYYY-MM-DD
-->

- <% tp.date.now("HH:mm") %> Started day

#### Session 
start:: <% tp.date.now("YYYY-MM-DD HH:mm") %>
topic:: 
end:: 
