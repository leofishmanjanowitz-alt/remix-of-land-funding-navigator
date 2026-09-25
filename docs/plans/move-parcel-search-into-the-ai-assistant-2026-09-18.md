# Move parcel search into the AI assistant

## Goal
Remove the floating search bar from the map and make the AI assistant the single place to enter either an address or a funding question.

## Changes
- Remove the top-center map search form and its map-level result notice.
- Keep the visible **AI assistant** entry point on the map so the combined input remains easy to find.
- Update the assistant composer to accept both kinds of input:
  - A matching address selects that parcel and confirms the selected address in the conversation.
  - A question receives the existing cited funding answer and continues to count against the free-question allowance.
  - An unmatched address-like entry gets a helpful in-conversation response without consuming a free question.
- Pass parcel selection from the assistant back to the map so the parcel facts, funding list, reports, and tasks update together.
- Update any empty-state wording that still tells users to use the removed search bar.
- Reposition the map layers control for the simpler map layout so it no longer reserves space for search feedback.

## Chat interface foundation
- Install and compose the AI Elements conversation, message, prompt-input, and shimmer primitives required for this chat surface.
- Preserve the existing civic visual direction, citations, next-step actions, free-question limit, and assistant-without-a-bubble treatment.
- Keep the submit control compact and ensure the composer works cleanly in both the desktop side panel and the smaller floating panel.

## Validation
- Verify address entry selects a mock parcel and updates the right panel.
- Verify funding questions still open and answer in the assistant with citations and actions.
- Verify failed address lookups remain inside the conversation and do not reduce the question allowance.
- Check desktop and compact layouts for overlap between map layers, tasks, assistant, and map controls.
- Confirm the project build and lint checks pass.
