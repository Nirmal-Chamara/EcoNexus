# F1.3 accessibility baseline

Scope: F1 shared components and the development component gallery. This is not
an audit of every existing application screen or caller-supplied style/color.

## Implemented checks

- Shared actionable controls have minimum 44-unit targets. Static cards, badges,
  avatars, and loaders are not buttons and do not need touch targets.
- Buttons, inputs, checkboxes, tabs, password toggles, dismissal controls, and
  loaders expose names and relevant state. Errors have live-region text.
- Contrast regression tests cover default enabled text on dark surfaces,
  status chips, primary/danger buttons, and avatar initials at >= 4.5:1.
- Text scaling remains enabled. Buttons grow vertically; tabs stack at large
  font scales or narrow viewports; avatars grow to accommodate scaled initials.
- Disabled controls retain their existing visual dimming. Inactive controls are
  exempt from the WCAG contrast minimum, not evidence of passing enabled text.

Reference: [WCAG contrast minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

## Manual device checklist - NOT YET PASSED

Open Expo developer menu > EcoNexus component gallery. Record device/OS, font
scale, screen reader, date, and result before checking each item.

- [ ] Android: default and largest font/display settings, portrait and landscape.
- [ ] iOS when available: largest accessibility text settings and VoiceOver.
- [ ] No clipped/overlapping labels, chip text, initials, or toast messages.
- [ ] Every interactive control is reachable and activates with TalkBack/VoiceOver.
- [ ] Checked, selected, disabled, busy, valid, and error states are understandable.
- [ ] Password is hidden initially; toggle announces show/hide correctly.
- [ ] Input focus and keyboard do not obscure the active field or following actions.
- [ ] Toast is announced and readable before dismissal; dismiss control is reachable.
- [ ] All targets can be tapped without activating adjacent controls.
- [ ] Close and Android Back exit the gallery without losing the app session.

Automated styles/semantics checks do not prove native layout or screen-reader
behavior. F1.3 acceptance remains pending these manual checks.
