# First prompt for Claude Code

Setup order:
1. Unzip this pack into a new repo folder and add the HB brand guidelines and the two asset xlsx files to reference/.
2. Open Claude Code in that folder.
3. From Claude Design, use "Handoff to Claude Code" and send it to the **local** agent in this folder.
4. Paste the prompt below.

---

Read CLAUDE.md, then everything in reference/, then the Claude Design handoff bundle. If the bundle differs from reference/checkpoint-8.html, the bundle is the newer design: tell me what differs before using it. This session is **Phase 0 only**: set up the repo and reach parity with reference/checkpoint-8.html. Don't start low-data mode or themes.

Before writing code, give me:
1. Your proposed folder structure and build setup.
2. How you'll extract the MEDIA blocks into assets, and which ones you'll try to replace with originals from the Wildcards DB/GCS.
3. Anything in CLAUDE.md that's unclear or that you'd push back on.

Then wait for my go-ahead. When parity is done, run tests/flow_smoke.py against the checkpoint and the new build on both layouts, show me side-by-side screenshots of each step, and list every difference you found.
