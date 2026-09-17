# T6 — Festive mobile-first design prototype

Type: prototype (HITL).

## Question

What does "polished festive Diwali shop" look like concretely? Build a
cheap visual prototype (sample products only, not the full catalog) and
react to it. Decided 2026-09-17 by Jerome: festive Diwali-shop style (no
reference sites); visual product cards (big image, price, discount) instead
of list rows; design-first mobile-first, must still work on desktop.

## Resolution

Prototype live 2026-09-17 at
https://sundar-traders-design.cottony-joggers.workers.dev
(festive header, 2-col card grid, 12 sample products). Awaiting reaction.
Round 2 (2026-09-17, Jerome): uniform short photos; net line hidden until
qty > 0. Deployed and live-verified.
Round 3 (2026-09-17, Jerome): tapping a filter chip scrolls back up to the
items. New staging URL (new temp account):
https://sundar-traders-design.upbeat-thunder.workers.dev — live-verified.
Round 4 (2026-09-17, Jerome): filter scroll offsets by measured sticky-bar
height so the heading clears it. Phone-width verified, deployed.
Round 5 (2026-09-17, Jerome): gold Buy button in bottom bar jumps to
checkout. Verified locally, deployed.
Round 6 (2026-09-17, Jerome): bar hidden until first item; docks above
checkout instead of floating over it. Phone-width verified, deployed.
Round 7 (2026-09-17, Jerome): per-card net removed; bar layered below
search bar; bar hides while Your Details is on screen. Verified, deployed.
Round 8 (2026-09-17, Jerome): bar hides only once the price summary is
visible (scroll-driven, observer proved unreliable). New staging URL:
https://sundar-traders-design.believed-breath.workers.dev — live (200).
Round 9 (2026-09-17, Jerome): bar back to fixed floating (sticky experiment
reverted). Verified, deployed.
Round 10 (2026-09-17, Jerome): bar tap opens order summary sheet; only Buy
goes to checkout. Verified locally, deployed.
Round 11 (2026-09-17, Jerome): separate sheet removed; the brown bar itself
expands with item rows, single total. Verified locally, deployed.
Round 12 (2026-09-17, Jerome): dead gap above Place Order removed
(empty error line); "View order details" popup in checkout. Verified,
deployed.
Round 13 (2026-09-17, Jerome): popup rows editable (steppers, line totals,
remove). Card sync verified, deployed.
Round 14 (2026-09-17, Jerome): tap-outside collapses the expanded bar.
Verified, deployed.
Round 15 (2026-09-17, Jerome): popup header/footer pinned, only item rows
scroll. Position-verified, deployed.
Round 16 (2026-09-17, Jerome): swiping also collapses the expanded bar.
Verified, deployed.
Round 17 (2026-09-17, Jerome): magnifier icon inside search bar.
Live-verified, deployed.
Round 18 (2026-09-17, Jerome): matching × clear icon replaces magnifier
while typing (native × suppressed). Swap verified, deployed.
Round 19 (2026-09-17, Jerome): tap-highlight flash removed globally.
Live-verified, deployed.
Round 20 (2026-09-17, Jerome): modal backdrop tint removed (sheet keeps
its own shadow). Live-verified, deployed.
Round 21 (2026-09-17, Jerome): bottom whitespace trimmed; footer is now
shop name + Call/WhatsApp (credits kept in credits.json until own photos
land). Live-verified, deployed.
Round 22 (2026-09-17, Jerome): bar + modal show/hide eased both ways
(class-driven opacity/transform transitions). Verified, deployed.
Round 23 (2026-09-17, Jerome): image hunt — Commons exhausted over 4
search rounds (only generic/display shots exist freely); competitor and
brand pack shots rejected (their property, and often wrong brand for
Sundar's stock). Blocked on shop's own photos; credits stay until then.
