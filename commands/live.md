---
description: Open the live bench and narrate what you are doing into it
argument-hint: "[path to a .knx file, default builds/rig.knx]"
allowed-tools: Bash(knex-cad:*), Read, Write, Edit
---

Start the live bench for `$1` (default `builds/rig.knx`) and work with it open.

1. `knex-cad live "$1" --open` in the background. It serves the bench, watches the build and the engine,
   and recompiles on every save, so the model in the browser follows your edits without a reload.
2. As you work, narrate into it so the person watching can follow:
   - `knex-cad log --kind reasoning "checking whether the fork clears the payload"`
   - `knex-cad log --kind image docs/patterns/07-gear-pair.png "the mesh distance is one white rod"`
   - `knex-cad log --kind note "step 4 done, moving to the wrist"`
3. Every file you edit and every command you run already appears there on its own, through the plugin's
   PostToolUse hook. You do not need to log those.

Post your reasoning before a change, not after: the point is that someone can watch you think, see what
you looked at, and watch the model rebuild.
