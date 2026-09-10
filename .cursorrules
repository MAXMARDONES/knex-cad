# Agent instructions

The full guidance for this repo lives in [AGENTS.md](AGENTS.md). Read that first.

Two rules prevent almost every K'NEX design mistake, and this repo enforces both:

- Rod lengths come only from the ladder: 37.5, 53.03, 75, 106.07, 150, 212.13 mm. A span of 3 U does not
  exist. Ask `knex-cad span a b` when unsure.
- A connector is a plane, not a point. Leave the normal off a `C` line and the solver derives it from the
  rods you attach, and tells you when they are not coplanar and you need a 3D pair.

Build in small steps, check after each one with `knex-cad <build>`, and finish with `knex-cad sim <build>`.
