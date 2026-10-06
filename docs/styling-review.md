# Styling review

October 6, 2026. Initial light/dark design proposal for Dashboard, Sales Orders and the order form. This is an interactive conversation mockup, not application implementation or approved final styling. Original wireframe retained separately.

## Proposed visual treatment

- Light theme: white surfaces, pale blue page/navigation backgrounds, blue headings and selections.
- Dark theme: navy page/navigation backgrounds, darker blue surfaces, lighter blue links and selections.
- Orange-yellow primary actions, including New Order and Send SO Email. Mark Complete uses a primary action; Mark Voided and deletion have distinct destructive styling.
- Status retains labeled colored boxes; information does not depend on color alone.
- System font, compact order table, grouped white/navy form sections and plain field labels.
- App-header theme toggle permits direct comparison of the same screen in both themes.

## Retained reviewed details

All seven divisions and the confirmed Terms, Freight-Shipping and Job Type lists. New Order immediately shows a demo number, three item rows, In Progress and blank Division. Assignment picker excludes selected employees. Closeout inputs precede bottom-positioned Mark Complete/Mark Voided actions and are required for those transitions. No legacy Voided checkbox or visible Monday Item ID. Order Details returns to the top of the order. AM Description remains text, prices are manual, and Hours Worked is intended to be calculated in the actual app.

## Review limits

Kent supplied black and white PNG logos, preserved without modification in docs/assets/logo-w-cart.png and docs/assets/logo-w-cart-white.png. The mockup embeds the black logo in light mode and white logo in dark mode, replacing the placeholder. Exact colors, font sizing, spacing and status-color associations await review. Other screens remain placeholders. The wide slide-out behavior is still represented by its contents, rather than a fully implemented overlay. Hours Worked, real persistence, authentication, delivery and file storage remain unimplemented. JavaScript syntax check passed; the rendered mockup has not been browser-verified.

## Next step

Review visual styling and logo placement, then review remaining screen layouts before application implementation. No commits, pushes or external changes were made. PNG is sufficient for this preview; an SVG or transparent high-resolution source can be supplied later if needed for scaling or backgrounds.
