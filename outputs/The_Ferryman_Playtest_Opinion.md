# The Ferryman: my playtest opinion

Based on the completed review of paper rules v0.2 and digital demo build 0.2.1, tested on 18 September 2026.

**My opinion: the core is promising and ready for your team's first playtest. The next priorities should be the ending and the usefulness of memories.**

The strongest part is the connection between named passengers and later consequences. Keeping Mother and Child together creates useful Joined Memories. Separating them puts Mother closer to becoming a wraith. In my assessment, this gives the resource puzzle a clear emotional subject, although real players still need to test whether it creates attachment or frustration.

The destinations also create meaningful choices. In the losing browser run, I had 8 obols but only 2 Standing before crossing 3. Tartarus would cause a pressure failure, while Elysium and Asphodel offered survivable alternatives. I deliberately selected the warned loss to verify the outcome. This shows why a financially successful run can still need a safer route. See the [full report, route comparison](The_Ferryman_Digital_Demo/PLAYTEST_REPORT.md#2-routes-already-create-a-useful-economic-choice).

The two issues I would address first are:

1. **The ending loses passenger decisions too early.** My successful run delivered all 12 souls by crossing 4, leaving crossings 5 and 6 empty. Resource decisions remained, but choosing whom to ferry had finished. I would test whether the team finds those turns tense or merely administrative before choosing a shorter trial, more late passengers, or a different ending condition. Evidence: [successful run](The_Ferryman_Digital_Demo/verification/browser/all-souls-run.json), `finalState.log[3..5]`.
2. **Some memories arrive too late to matter.** The Musician and Listener's Joined Memories remained in the queue when the successful run ended. Their relationship produced a reward that never became playable. Memories are central to the concept, so I would prioritize giving them a clearer opportunity to affect later choices. Evidence: the same successful run, `finalState.queue`.

My recommendation is to keep the current rules for the first uncoached team session, record where players hesitate or need help, then change one thing at a time. After pacing and memory usefulness are understood, consider whether destinations should also reflect individual souls' wishes or stories.

Major decisions remain with your team: whether full rescue should be reliably possible, whether sacrifice should be unavoidable, how the trial should end, and how much narrative meaning each destination should carry.

This opinion comes from one successful browser run, one deliberately losing browser run, and separate deterministic design experiments. It is agent analysis, not human playtest evidence or proof of enjoyment or balance. The recorded engine verification passed **32 checks with 0 failures**. See the [full playtest report](The_Ferryman_Digital_Demo/PLAYTEST_REPORT.md) and [validation record](The_Ferryman_Digital_Demo/VALIDATION.md).

Source freshness checked before creating this extract: engine test results dated 18 September 2026, 13:48:46, followed by the full report dated 13:58:15. This workspace has no Git history, so no commit-based freshness comparison was available. This file summarizes the existing review; it does not describe a new playtest.
