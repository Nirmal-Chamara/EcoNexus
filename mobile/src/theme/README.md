# F1.1 design tokens

Import tokens from `src/theme` or keep existing `theme/colors` and
`theme/typography` imports. The barrel also exports a combined `theme` object.

In Expo Go development mode, open the developer menu (shake the device or press
`m` in Metro) and select **EcoNexus design tokens**. The scrollable preview shows
every exported color, typography preset, size, weight, line-height multiplier,
spacing, radius, and shadow. Close returns to the unchanged app session;
Android Back also closes it. No backend or login is required for the preview.

## Source status

The F1.1 brief specifies emerald primary `#10B981`, spacing 4/8/12/16/24,
and radii 12/16/24/pill. Remaining palette and shadow values are provisional.
Existing dark surface and semantic colors are retained for compatibility.
Mint and neutral primitives are available for future light surfaces.

No Figma file/frame or font assets were supplied. Existing system typography
is deliberately retained: neither Inter nor Plus Jakarta Sans is claimed to
be loaded. Confirm the font family, weights, exact palette, and shadows against
Figma before design sign-off. Do not use mint backgrounds with light text.

Native shadows provide iOS shadow properties and Android elevation. Verify
rendering on both platforms; this implementation has not yet been device-tested.
