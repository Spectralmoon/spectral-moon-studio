# AI Video Pipeline · operating instructions for an agent

> **What this is:** drop this file into your project root (or your `CLAUDE.md`) and your assistant will
> run an AI image and video pipeline the way our studio runs it. It is written for the machine, not for
> a reader. The companion booklet covers the prompting vocabulary; this covers the procedure, the state
> handling, and the money.
>
> From Susana Barrero, Spectralmoon Studio. Method compiled from GenHQ, the Ohneis Visual Director
> system, and a number of expensive mistakes.

---

## 0. The one rule that outranks every other rule

**Never fire a generation without explicit human approval for that specific generation.**

Silence is not approval. "Looks good" is not approval. "Continue" is not approval. Approval is the
human saying go, for this shot, now.

This is not timidity. Generation is the only tool call in the pipeline that bills immediately and
cannot be undone. Everything else in this document is reversible. This is not.

**The loop, every single time:**

1. Present the full plan in text: the shot, the tool, the model, the prompt, the references, the cost.
2. Stop. Wait for an explicit go.
3. Fire exactly one generation.
4. Show the result. Get the verdict.
5. Only then move to the next.

Never batch fires "to save time". Batching converts one wrong assumption into five wrong charges.

---

## 1. What the agent owns, and what the human owns

This pipeline is genuinely agentic: there is a goal, tools get called, state is carried between
steps, and the next action is derived from that state rather than dictated. The human gate does not
make it less agentic. It makes it affordable.

**The agent owns:**
- Reading the storyboard and deciding which shot comes next
- Choosing the tool and the model for that shot, and justifying the choice
- Assembling the prompt to spec (see the booklet)
- Tracking which output feeds which input: the frame chain and every asset id
- Naming, filing and logging every asset in a predictable structure
- Noticing drift, degradation, or a broken chain, and saying so before spending more
- Retrying *its own* non-billable errors (a failed upload, a malformed request) without asking

**The human owns:**
- The go ahead
- The aesthetic verdict
- The money

If the agent is ever unsure whether something bills, it asks. Asking is free.

---

## 2. Tool routing, and why

Cost, not preference, decides the tool. Get this wrong once and it is visible on the invoice.

| Job | Tool | Model | Why |
|---|---|---|---|
| Stills, all iteration | Magnific | **Nano Banana** specifically | Roughly 75 credits per still. The other models on the platform cost far more for no gain on this work |
| Video, every shot | Higgsfield | Seedance primarily, Kling when both start and end frames must be controlled | Runs on a plan rather than premium credits |
| Character lock, recurring | Higgsfield | Soul ID | Trained identity, so references do not need re-passing forever |
| Upscale, frame rate | Whichever tool holds the approved take | n/a | Last step, on approved material only |

**Hard rule: never generate video on the stills platform.** One five second clip billed there cost
about 3,500 credits against roughly 75 for a still. That is a factor of about forty seven. This
mistake is the single most expensive thing in this document.

**Kling versus Seedance:** Seedance is the default. Reach for Kling only when the shot needs both its
opening and closing composition pinned, for example a product reveal or a character entrance. Kling
is slower and dearer, so it is a deliberate choice, never a fallback.

---

## 3. Validate cheap, then commit expensive

Every generator has a draft tier. Use it, always, for the first pass.

- **First submission of any shot runs in the fast or draft mode.** No exceptions.
- **Standard or high quality mode is only ever spent on a shot that is already approved in draft.**
- Upscaling and frame rate work happen **once, at the very end**, on the approved take only.

The reasoning: composition, timing, camera move and continuity are all fully judgeable at draft
quality. Resolution tells you nothing about whether the shot works. Paying for resolution before the
shot is approved is paying to render a mistake sharply.

---

## 4. The order of operations

Follow it in order. The sequence is the cost control, not a style preference.

1. **Storyboard the whole piece first.** Every shot, start to finish, before a single generation. Frame
   by frame invention is where continuity dies and where budgets die with it.
2. **Lock the palette.** Choose the hex values, then render them into a horizontal strip PNG. From here
   on the palette is passed as an *image*, never described in words.
3. **Lock the characters.** One composite turnaround, five angles, generated in a single fire. See §5.
4. **Build the stills** in the cheap tool, in draft mode, iterating freely.
5. **Get the still approved.** An unapproved still becomes an expensive unapproved video.
6. **Chain the video**, each shot beginning from the previous shot's true last frame. See §6.
7. **Enhance last.** Upscale and frame rate on the approved take only.

**Reference first, always.** Whenever a reference image exists or could exist, feed it. Image to image
beats text to image on style, lighting, identity and composition. If a text-only attempt fails, the
fix is a reference image, not a re-roll of the text.

---

## 5. Character state

The character sheet is the most reused asset in the pipeline, so it gets its own discipline.

**Generate it as a single composite turnaround: five angles in one image, one fire.** Never five
separate generations. Five separate fires produce five subtly different people, which is precisely
the problem the sheet exists to prevent.

**Pass the character reference at every scale, including tiny and distant figures.** A background
figure described in text will drift: wrong garment, wrong hair, wrong build. Discovering that costs a
re-fire.

**For a character who recurs across a body of work, promote the sheet to a Soul ID** in the video
tool. That trains the identity so it holds without re-passing references on every shot.

### Three traps, each learned by paying for it

1. **Never pass the full turnaround when placing a character into a scene.** The model averages the
   poses and keeps the dominant facing direction, ignoring the text. Crop the single view whose pose
   and facing match the shot, flip it horizontally if needed, and pass that crop alone. Full sheets
   are for identity locking and for building new sheets, nothing else.
2. **Never reposition a character using a scene reference that already contains that character.** The
   model anchors to the baked-in pose or adds a duplicate. Generate a clean empty plate first,
   everything else identical, then place the cropped character into the clean plate.
3. **Never re-describe a character who is locked by reference.** Say "the figure" and let the image
   carry identity. Repeating appearance fights the reference, and stacking body vocabulary raises the
   odds of a content filter rejection. Spend the prompt on motion, action and environment.

---

## 6. Frame chaining, the state that makes it a pipeline

This is the part that turns a set of generations into a continuous piece, and it is the part most
implementations get wrong.

**The rule: shot N+1 starts from shot N's true last frame.**

Not from the still that inspired shot N. Not from a re-render. The actual final frame of the actual
approved clip. Extract it, save it, and use it as the start frame of the next generation.

**Why "true" matters:** if the previous clip was retimed, trimmed, crossfaded or upscaled, its last
frame changed. Extract the last frame from the *file you are chaining from*, after all edits, not
from an earlier version.

**Continuity check before each new shot,** answered from the last frame rather than from memory:
- Where is the camera, and what is it facing?
- What is now behind the camera? That determines what cannot be in the next shot.
- What was the light doing, and at what colour temperature?

That last question catches the most common continuity break: a scene that walks into a differently
lit room for no reason.

**When the camera must turn:** a turn in place is its own shot. Generate a still of the reversed view
first, then a short turn-in-place clip onto it, then continue walking. Trying to turn and travel in
one generation produces geometry that does not exist.

---

## 7. Asset identifiers and the upload dance

Local files are not directly usable by the generation APIs. They have to be uploaded first, and the
identifier that comes back is what the prompt actually references.

**The procedure:**

1. `media_upload` with the local file. This returns a presigned URL and an id.
2. `PUT` the raw bytes to that presigned URL.
3. `media_confirm` to finalise the upload.
4. Use the returned **media id** in the generation call, in the media array, with the correct role
   (for example `image` for a visual reference).

**The state the agent must maintain,** because nothing else will:

- A manifest mapping every media id to what it actually is, in human words. `a3f9c2...` means nothing
  in a week. `a3f9c2 = Maya character sheet v2, 5-angle composite, locked` means everything.
- Which shot each id feeds, so a chain can be rebuilt after an interruption.
- Which ids are superseded, so a stale reference is never silently reused.

**Keep this manifest in a plain file in the project, not in conversation memory.** Conversation memory
ends when the session does. The pipeline must survive that. Treat the manifest as the source of truth
and re-read it at the start of every session rather than trusting recall.

**Cache-bust law:** changed media always ships under a new filename. Never overwrite an asset in
place. Overwriting breaks caches, breaks chains, and makes it impossible to tell which version a
given shot actually used.

---

## 8. Recovery, when a frame degrades

Feed a generated image back in as a reference enough times and damage compounds: smear, plastic skin,
melted detail. Re-prompting the damaged frame bakes the damage deeper.

An image holds two layers of information. **Low frequency** is what does not repeat: geometry,
layout, structure, the bones. **High frequency** is what does repeat: skin, fabric, grain, texture.
Degradation almost always rots the high frequency layer while the bones stay sound.

**So do not re-roll.** Reduce the image to an outline sketch, which discards the ruined texture and
keeps the structure, then render new surfaces onto that clean skeleton. Rebuilding skin on good
bones, rather than repairing pixels.

---

## 9. Colour consistency across a set

A model cannot hold colour steady across independently generated scenes. Six frames generated
separately give six slightly different worlds, and the set reads as a collection rather than a film.

**Lock the palette as hex, render it as a horizontal strip image, and pass that strip into every
single frame** as an explicit colour reference. One shared input grades the entire set.

Where multiple references are in play, give each one a single job so they do not fight:

| Input | Locks |
|---|---|
| Location or mood render | Lighting, atmosphere, overall colour feel |
| Composition sketch | Framing and placement |
| Character reference | Face, hair, wardrobe |
| Palette strip | The exact grade, shared across every scene |

Most drift comes from asking one image to do three jobs at once.

---

## 10. Failure modes worth knowing before you meet them

- **Chroma corruption on blend operations.** Blending video on `yuv420p` corrupts colour and turns
  everything purple. Convert both inputs to `gbrp` first, then blend.
- **Playback rate is not slow motion.** Setting a low playback rate on 24fps footage shows each frame
  about three times and reads as stutter. Bake the slowdown with motion interpolation instead, so new
  frames are synthesised rather than repeated.
- **Reference count ceilings.** Some video models hard-fail above a certain number of references.
  Stay at or below eight.
- **Content filters trip on stacked body vocabulary,** especially combined with any age descriptor.
  Keep the prompt on motion and environment, and let references carry the body.
- **Negatives need the "no" prefix.** Write "no X", never "avoid X". Bare tokens enforce weakly, and
  this holds inside tool-native negative fields too.

---

## 11. Session start checklist for the agent

At the start of any session on an existing project:

1. Read the project manifest. Do not trust recall for asset ids or chain state.
2. Identify the last approved shot and the last approved frame.
3. Report where the piece stands, what is next, and what it will cost.
4. Wait for a go.

---

*Spectralmoon Studio · Susana Barrero · 2026*
*Companion to the method booklet, "The Vocabulary of a Directed Image".*
