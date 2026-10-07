# LATTICE Mobile Interface Design

## Product Direction

LATTICE is a portrait-first, one-handed iOS-style mobile experience for exploring what matter can become. The interface should feel like a scientific instrument: dark, calm, precise, and layered, with restrained glow, thin grid lines, and clear model-status language. The first milestone prioritizes a trustworthy product loop over decorative complexity.

## Screen List

| Screen | Primary content and functionality |
|---|---|
| Onboarding | Three short educational steps: choose a material system, change one parameter, observe one result. Includes Skip and Continue actions, with the final action entering Explore. |
| Explore | Welcome header, Start an experiment CTA, featured WSe2/WS2 system, starter experiment cards, concept explainers, and a recently viewed section. The screen should make the core loop immediately discoverable. |
| Material detail | Material name, formula, category, dimensionality, representative lattice metadata, selected properties, optical/excitonic/phonon notes, provenance, and compatible experiment templates. This is a progressive-disclosure destination for later milestone work. |
| Lab | Two-layer composer for Layer A and Layer B, twist-angle presets and numeric control, a procedural 2.5D lattice visualization, modeled outputs, and a contextual LATTICE Copilot entry point. |
| Library | Saved experiments, favorite materials, bookmarked concepts, and recent items. Includes search, sorting/filtering affordances, resume actions, and later compare selection. |
| Compare | Phone-friendly side-by-side comparison of two saved experiments, showing parameter, output, and visual differences. Reserved for a later milestone but represented in navigation architecture. |
| Profile | Personal discovery summary, experiment badges/milestones, preferences, privacy controls, and model/data disclaimers. |
| Copilot sheet | Contextual assistant surface launched from Explore or Lab, displaying structured explanation, uncertainty/model-status labels, and suggested next experiments. |

## Navigation Model

Use a bottom tab bar with four primary destinations: Explore, Lab, Library, and Profile. Keep Copilot contextual rather than a fifth tab. Use stack/modal routes for material detail, onboarding, compare, and the Copilot sheet. Tab labels should remain visible and use familiar SF Symbol equivalents with accessible labels.

## Key User Flows

### First launch

1. User sees the LATTICE mark and completes or skips three onboarding cards.
2. User lands on Explore and sees the WSe2/WS2 demo system.
3. User taps Start an experiment and enters Lab.

### Primary experiment loop

1. User reviews WSe2 as Layer A and WS2 as Layer B.
2. User adjusts twist using a slider, exact value entry, or a preset such as 0°, 1°, 2°, 3°, 5°, 10°, or 30°.
3. The visualization responds with two layered lattices and an educational moiré-like pattern.
4. Modeled outputs update beneath the visualization, each marked as an educational approximation and given a confidence/model-status label.
5. User opens LATTICE Copilot to ask why the result changed.
6. User saves the experiment locally and later resumes it from Library.

### Material discovery

1. User searches by common name, formula, alias, category, or tag.
2. User taps a material card to open its detail route.
3. User selects a compatible experiment template and returns to Lab with typed parameters.

## Layout and Interaction Rules

Screens use `ScreenContainer` for safe areas. Content is arranged in a vertical scroll with 16–20pt horizontal insets, minimum 44pt touch targets, and bottom padding that clears the tab bar. Primary actions use filled accent buttons and subtle press feedback; secondary actions use bordered or text treatments. Use FlatList for repeated collections. Never make gestures the only path for changing a scientific parameter: provide slider, numeric input, and preset chips together.

The Lab should keep the visualization above the fold when possible, with controls grouped in a compact parameter card below the layer summary. Results should use compact scientific data blocks with a title, value or qualitative tendency, explanatory caption, and status badge. Avoid implying publication-grade accuracy.

## Color Choices

| Token | Color | Use |
|---|---|---|
| Background | `#07111F` | Deep instrument-like canvas and main app background |
| Surface | `#0D1B2E` | Cards, sheets, and elevated control groups |
| Surface raised | `#13263D` | Selected cards and active control surfaces |
| Foreground | `#F4F8FC` | Primary text and high-contrast labels |
| Muted | `#9FB0C3` | Supporting copy and model caveats |
| Border | `#27415C` | Hairlines, dividers, and unselected controls |
| Primary cyan | `#65E6E0` | Main actions, selected states, and lattice highlights |
| Secondary violet | `#9B8CFF` | Copilot, layered depth, and exploratory emphasis |
| Warm signal | `#FFC76B` | Confidence cues and selected modeled output accents |
| Error | `#FF7D8A` | Validation and failure states, never as a sole status cue |

Use cyan and violet sparingly against the navy background. Pair all color cues with labels or icons for accessibility. Respect reduced-motion preferences and dynamic text sizing.

## Scientific Communication

The visualization and outputs must explicitly say when they are simplified, illustrative, modeled, or educational. Distinguish curated material metadata from deterministic educational estimates. Do not fabricate citations, measured values, or hidden UI state. The UI should expose model version and provenance in detail routes and export surfaces in later milestones.

## Milestone 1 Boundary

Milestone 1 implements the shell, onboarding, four tabs, the Explore/Lab/Library/Profile surfaces, reusable design primitives, and navigation-ready routes. Material catalog search, deterministic models, local persistence, backend synchronization, Copilot grounding, comparison, export, and comprehensive QA remain subsequent vertical slices unless needed to keep the initial interaction demonstrably functional.

## References

The design is derived from the user-provided LATTICE master build prompt and visualization upgrade code pack attached to this task.
