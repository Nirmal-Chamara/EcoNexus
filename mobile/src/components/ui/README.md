# F1.2 core components

Import from `src/components/ui`. The Button export shares the existing common
Button implementation. Existing FormInput consumers remain unchanged.

Open Expo's developer menu and select **EcoNexus component gallery**. It is
development-only, needs no login, and closes without replacing the app session.

- Button: primary/secondary/ghost/danger, loading and disabled.
- Input: forwarded ref, leading Ionicon, focus, valid, error, disabled.
- PasswordInput: hidden by default, accessible reveal/hide toggle.
- Checkbox and SegmentedTabs: controlled values and disabled states.
- Card: standard/elevated; Chip (also Badge): success/error/warning/info/neutral.
- Avatar: image, initials, empty-name and failed-image fallbacks.
- Toast: controlled visibility, tone, dismiss callback, duration (0 stays visible).
  Keep onDismiss stable with useCallback. Mount at the desired screen position;
  this is an inline notification, not a global overlay provider.
- Loader: small/large and label. EmptyState: optional message and action.
- ScreenContainer: safe area, keyboard avoidance, optional scrolling/header offset.

The gallery demonstrates variants and interactive states. Focus inputs to check
focus styling and keyboard behavior. Real-device layout, font scaling, keyboard,
and screen-reader checks are still required. Exact Figma values remain unverified.
