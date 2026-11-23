---
name: Caracas Mobility & Delivery Pulse
colors:
  surface: '#111413'
  surface-dim: '#111413'
  surface-bright: '#373a38'
  surface-container-lowest: '#0c0f0e'
  surface-container-low: '#191c1b'
  surface-container: '#1d201f'
  surface-container-high: '#282b29'
  surface-container-highest: '#323534'
  on-surface: '#e1e3e1'
  on-surface-variant: '#bec9c6'
  inverse-surface: '#e1e3e1'
  inverse-on-surface: '#2e3130'
  outline: '#889390'
  outline-variant: '#3e4947'
  surface-tint: '#84d5c8'
  primary: '#84d5c8'
  on-primary: '#003732'
  primary-container: '#006a60'
  on-primary-container: '#95e7da'
  inverse-primary: '#016a60'
  secondary: '#94d3c1'
  on-secondary: '#00382e'
  secondary-container: '#0b5345'
  on-secondary-container: '#86c5b3'
  tertiary: '#5edac9'
  on-tertiary: '#003731'
  tertiary-container: '#006a5f'
  on-tertiary-container: '#71ecda'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#9ff2e4'
  primary-fixed-dim: '#84d5c8'
  on-primary-fixed: '#00201c'
  on-primary-fixed-variant: '#005048'
  secondary-fixed: '#afefdd'
  secondary-fixed-dim: '#94d3c1'
  on-secondary-fixed: '#00201a'
  on-secondary-fixed-variant: '#065043'
  tertiary-fixed: '#7df7e5'
  tertiary-fixed-dim: '#5edac9'
  on-tertiary-fixed: '#00201c'
  on-tertiary-fixed-variant: '#005048'
  background: '#111413'
  on-background: '#e1e3e1'
  surface-variant: '#323534'
  surface-base: '#111413'
  surface-card: '#191D1C'
  surface-card-elevated: '#202624'
  border-subtle: '#24302C'
  border-focus: '#354A44'
  text-primary: '#E1E3E1'
  text-secondary: '#A0ABA6'
  text-muted: '#6C7A75'
  accent-mint: '#7EF8E6'
  accent-mint-dim: rgba(126, 248, 230, 0.12)
  currency-usd: '#2ECC71'
  currency-ves: '#3B82F6'
  currency-eur: '#F59E0B'
  currency-cop: '#EC4899'
  rate-tag-bg: '#142521'
  pago-movil-purple: '#8B5CF6'
  status-error: '#FF5449'
typography:
  display-lg:
    fontFamily: Roboto Flex
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Roboto Flex
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 42px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Roboto Flex
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Roboto Flex
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Roboto Flex
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  title-lg:
    fontFamily: Roboto Flex
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  title-md:
    fontFamily: Roboto Flex
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-lg:
    fontFamily: Roboto Flex
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Roboto Flex
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Roboto Flex
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-currency:
    fontFamily: Roboto Flex
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 18px
    letterSpacing: 0.04em
  label-bold:
    fontFamily: Roboto Flex
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-micro:
    fontFamily: Roboto Flex
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.08em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2.5rem
  space-2xs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

This design system establishes a high-performance, dark Material 3 design language specifically calibrated for the Venezuelan urban economy. Combining the logistical rigor of an on-demand mobility service with the dynamic convenience of a multi-vertical delivery app, the interface is engineered around the realities of Venezuelan commerce: real-time multi-currency conversions (USD, VES, EUR, COP), variable mobile connectivity, and localized instant payment methods (Pago Móvil, biometrics, BCV daily indexation).

The visual aesthetic fuses dark utilitarianism with luminous chromatic accents. Rather than pure OLED black, the backdrop uses a deep, atmospheric charcoal-slate that eliminates harsh edge contrast while retaining immense battery efficiency. Elevated surfaces introduce deep sea-teal undertones, framed by subtle emerald hairline borders. Crucial calls to action, active transit routes, and settlement figures pulse with high-visibility emerald green and glowing mint highlights, delivering an experience that feels ultra-modern, resilient, and financially unambiguous.

## Colors

The color palette prioritizes legibility, depth perception in high ambient glare, and instantaneous transactional recognition.

### Palette Hierarchy & Functional Roles
- **Base Canvas (`#111413`)**: The subterranean canvas backdrop across all views.
- **Surface Elevation Cards (`#191D1C` & `#202624`)**: Elevated containers separating modules (delivery tracking, vehicle dispatch, payment selectors) with an organic teal-charcoal hue.
- **Structural Hairstyle Outlines (`#24302C`)**: Used on cards and inputs to define boundaries without visual noise.
- **Primary Action (`#006A60`)**: Anchors primary buttons, completion flows, and affirmative CTAs.
- **Interactive Mint Accent (`#7EF8E6`)**: Reserved for live GPS trackers, dynamic delivery ETA badges, interactive toggle states, and secondary action highlights.
- **Text Hierarchy**: Headings and primary metrics utilize `#E1E3E1` for maximum contrast against dark containers; descriptive and structural metadata utilizes `#A0ABA6`.

### Venezuelan Multi-Currency Identifiers
Currency badges use dedicated color-coding to prevent ambiguity at checkout:
- **USD ($)**: Mint Emerald (`#2ECC71`)
- **VES (Bs.)**: Bolívares digital identity blue (`#3B82F6`)
- **EUR (€)**: Amber gold (`#F59E0B`)
- **COP**: Vibrant magenta (`#EC4899`)
- **Official Exchange Index (BCV)**: Housed within a dedicated `#142521` pill with `#7EF8E6` micro-indicators.

## Typography

Typography relies on **Roboto Flex** across all display, body, and UI label layers. Its mechanical versatility and crisp terminal rendering guarantee immediate legibility on screens under intense outdoor tropical sunlight, as well as on lower-density displays common across mid-market mobile devices.

### Numerical & Financial Formatting
- Currency amounts, live price conversions, and trip meters utilize tabular numerals (`font-variant-numeric: tabular-nums`) to prevent jittering when values update via live exchange websockets.
- Dual-currency expressions display the anchor primary rate in `title-lg` / `title-md` (`#E1E3E1`), accompanied directly below or adjacent by the BCV-converted counterpart in `body-sm` (`#A0ABA6`).
- Headlines use a tight letter-spacing to emphasize authority and speed. Micro labels use an uppercase treatment with expanded tracking (`0.05em` to `0.08em`) for contextual clarity in dense navigation bars.

## Layout & Spacing

The layout is built upon an 8-point base spatial system, scaled dynamically across viewport classes to manage compact mobile delivery dashboards as well as expansive fleet dispatch screens.

### Grid & Adaptive Layout Rules
- **Mobile Handheld (0 - 599px)**: 4-column fluid layout with `1rem` outer margins and `0.75rem` gutters. Map and trip views render full-bleed, docking all functional cards (ride choices, restaurant menus, and payment trays) in expandable bottom sheets.
- **Tablet (600 - 1023px)**: 8-column layout with `1.5rem` margins. Splits the interface into an interactive map or media pane (5 columns) and an operations or order details tray (3 columns).
- **Desktop / Kiosk (1024px+)**: 12-column fixed-max container capped at `1280px` centered width, with `2.5rem` margins and `1.5rem` gutters. 

Content spacing uses strict atomic increments: micro indicators and badges employ `space-2xs` and `space-xs`; standard card containers utilize `space-md` inner padding; modular blocks separate via `space-lg`.

## Elevation & Depth

This design system expresses hierarchy through tonal surface shifts complemented by hairline borders, intentionally replacing muddy standard drop shadows with crisp ambient green-tinted depth.

### Surface Elevation Tiers
1. **Tier 0 (Canvas Base - `#111413`)**: The lowest plane. Hosts background map tiles, full-page route views, and uncontained layout space.
2. **Tier 1 (Surface Cards - `#191D1C`)**: Standard interactive panels, driver summaries, restaurant item lists, and delivery trackers. Bound by a structural 1px border (`#24302C`).
3. **Tier 2 (Elevated Sheets & Floating Trays - `#202624`)**: Active modal sheets, ride booking dialogs, and sticky bottom navigation bars. Border increases to `#354A44` to amplify physical separation.
4. **Tier 3 (Floating Overlays & Over-Map Pills)**: Currency switchers, SOS quick-buttons, and dynamic notifications float above maps with a semi-opaque background blur:
   - `background: rgba(25, 29, 28, 0.88)`
   - `backdrop-filter: blur(12px)`
   - `box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.45), 0 0 12px 0 rgba(0, 106, 96, 0.15)`

Hairline rims utilize high light-direction neutrality, ensuring interactive surfaces stand distinct from map terrain.

## Shapes

The design system adopts a layered geometry: structural cards use generous curvature, while inline controls and indicators take pill shapes.

- **Primary Cards & Bottom Sheets**: Use `rounded-2xl` (`1rem` / `16px` or `1.5rem` / `24px` for parent sheets), introducing an approachable, ergonomic handheld aesthetic that softens dense data feeds.
- **Interactive Buttons, Chips, and Currency Badges**: Set to fully rounded pill geometry (`rounded-full` / `9999px`). This eliminates sharp corners in rapid-tap zones and differentiates quick-select chips from informative card bodies.
- **Inputs & Data Fields**: Styled with `rounded-xl` (`0.75rem` / `12px`) to harmonize between the softness of the cards and the pill buttons.

## Components

### 1. Primary Action & Secondary Buttons
- **Primary CTA**: Full pill shape (`rounded-full`), height `52px` on mobile, background `#006A60`, text `#E1E3E1` (weight 700). On press/hover, background transitions to `#004D40` with a subtle `#7EF8E6` glow.
- **Accent/Express Action**: Background `#7EF8E6`, text `#111413` (weight 700). Used for immediate checkout, order tracking, and live driver contact.
- **Secondary / Ghost Button**: Hairline border `1.5px` solid `#24302C`, background `rgba(25, 29, 28, 0.6)`. Active state brings a border color transition to `#7EF8E6`.

### 2. Multi-Currency Pills & Exchange Rate Bar
- **Currency Switcher**: Inline horizontal cluster of pill-shaped tags (`USD $`, `VES Bs.`, `EUR €`, `COP`). The selected state features an active fill of `rgba(126, 248, 230, 0.12)`, border `1px solid #7EF8E6`, and text `#7EF8E6`. Inactive pills use background `#191D1C`, border `1px solid #24302C`, and text `#A0ABA6`.
- **BCV Live Rate Indicator**: Fixed micro-banner or header pill displaying official central bank parity. Background `#142521`, border `1px solid #006A60`, text `#7EF8E6` in `label-bold`, showing an oscillating refresh pulse dot.

### 3. Payment Method Cards (Venezuelan Fintech Integration)
- **Pago Móvil Card**: Elevated container (`#191D1C`), featuring recipient bank selector, national identity document prefix (V/E/J), registered mobile number, and an automated clipboard validation badge.
- **Biometric & Fast-Pay Card**: Shows integrated Zelle, Pago Móvil, or localized digital wallets with instant exchange rate calculation visible prior to biometric authentication.

### 4. Cards & Ride / Delivery Option Selectors
- **Vertical Service Card**: Container `#191D1C`, border `1px solid #24302C`, radius `16px`. Active/selected vehicle or meal container gets a `2px solid #7EF8E6` outline with a subtle interior gradient blend toward `#006A60`.
- Includes dual-price layout: Primary large balance `$5.20` flanked by bold subtitle `Bs. 192.40 (BCV)`.

### 5. Input Fields & Search Bars
- Background `#111413` with `1px solid #24302C`, corner radius `12px`, height `48px`. Placeholder text `#6C7A75`, entered text `#E1E3E1`. Focused state transitions border to `#7EF8E6` with a ring of `rgba(126, 248, 230, 0.2)`.

### 6. Badges, Tags, & Live Order Trackers
- **Status Badges**: Delivery underway, Driver assigned, or Payment Verified. Pill-shaped containers (`height: 24px`, padding `0 10px`).
- **Live ETA Tracker**: Glowing mint accent dot with an expanding radar pulse animation beside bold time predictions.