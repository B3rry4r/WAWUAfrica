/* @ds-bundle: {"format":4,"namespace":"WAWUAfricaDesignSystem_c75192","components":[{"name":"ContentCard","sourcePath":"components/content/ContentCard.jsx"},{"name":"PriceChip","sourcePath":"components/content/PriceChip.jsx"},{"name":"ComingSoonPill","sourcePath":"components/content/PriceChip.jsx"},{"name":"AccessBadge","sourcePath":"components/content/PriceChip.jsx"},{"name":"SectionHeader","sourcePath":"components/content/SectionHeader.jsx"},{"name":"Avatar","sourcePath":"components/core/Avatar.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"Input","sourcePath":"components/core/Input.jsx"},{"name":"NairaInput","sourcePath":"components/core/Input.jsx"},{"name":"MISUSE_REASON","sourcePath":"components/feed/CategoryBar.jsx"},{"name":"CATEGORIES","sourcePath":"components/feed/CategoryBar.jsx"},{"name":"FILTERS","sourcePath":"components/feed/CategoryBar.jsx"},{"name":"CategoryTag","sourcePath":"components/feed/CategoryBar.jsx"},{"name":"CategoryBar","sourcePath":"components/feed/CategoryBar.jsx"},{"name":"EngagementBar","sourcePath":"components/feed/EngagementBar.jsx"},{"name":"StatusPill","sourcePath":"components/feed/StatusPill.jsx"},{"name":"HandoffPill","sourcePath":"components/feed/StatusPill.jsx"},{"name":"EmptyState","sourcePath":"components/feedback/EmptyState.jsx"},{"name":"ErrorState","sourcePath":"components/feedback/EmptyState.jsx"},{"name":"Skeleton","sourcePath":"components/feedback/EmptyState.jsx"},{"name":"ProfileHeader","sourcePath":"components/identity/ProfileHeader.jsx"},{"name":"VERIFY_TIERS","sourcePath":"components/identity/VerificationBadge.jsx"},{"name":"VerificationBadge","sourcePath":"components/identity/VerificationBadge.jsx"},{"name":"TierBadge","sourcePath":"components/identity/VerificationBadge.jsx"},{"name":"StatBlock","sourcePath":"components/identity/VerificationBadge.jsx"},{"name":"ListRow","sourcePath":"components/lists/ListRow.jsx"},{"name":"Sheet","sourcePath":"components/overlay/Sheet.jsx"},{"name":"TRUST_EARNS","sourcePath":"components/trust/TrustMeter.jsx"},{"name":"TRUST_LOSES","sourcePath":"components/trust/TrustMeter.jsx"},{"name":"TrustMeter","sourcePath":"components/trust/TrustMeter.jsx"},{"name":"TRUST_TIERS","sourcePath":"components/trust/TrustScoreChip.jsx"},{"name":"TrustScoreChip","sourcePath":"components/trust/TrustScoreChip.jsx"}],"sourceHashes":{"components/content/ContentCard.jsx":"8f87fab4b8b1","components/content/PriceChip.jsx":"84e44eadd3a2","components/content/SectionHeader.jsx":"dd14cad753d5","components/core/Avatar.jsx":"1f66e3e3a296","components/core/Button.jsx":"794d9be37f09","components/core/Icon.jsx":"9133a8a920d3","components/core/Input.jsx":"1e3963384acf","components/feed/CategoryBar.jsx":"dc6f7218dd96","components/feed/EngagementBar.jsx":"9df695179e99","components/feed/StatusPill.jsx":"6049a604faf1","components/feedback/EmptyState.jsx":"02af9517cfd4","components/identity/ProfileHeader.jsx":"a9486ce3f6a2","components/identity/VerificationBadge.jsx":"7905f89df274","components/lists/ListRow.jsx":"d48464521bdd","components/overlay/Sheet.jsx":"7611607bd5a2","components/trust/TrustMeter.jsx":"0d507ab829e3","components/trust/TrustScoreChip.jsx":"4c105b588a97"},"inlinedExternals":[],"unexposedExports":[{"name":"canonicalTier","sourcePath":"components/identity/VerificationBadge.jsx"},{"name":"fmtPts","sourcePath":"components/trust/TrustScoreChip.jsx"},{"name":"formatNaira","sourcePath":"components/core/Input.jsx"},{"name":"nextTierInfo","sourcePath":"components/trust/TrustScoreChip.jsx"}]} */

(() => {

const __ds_ns = (window.WAWUAfricaDesignSystem_c75192 = window.WAWUAfricaDesignSystem_c75192 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Avatar({
  initial = 'A',
  size = 40,
  src,
  ring = false,
  accent = false,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      width: size,
      height: size,
      borderRadius: 999,
      flexShrink: 0,
      overflow: 'hidden',
      background: src ? `center/cover url(${src})` : accent ? 'var(--accent)' : 'var(--surface-tag)',
      color: accent ? 'var(--text-on-accent)' : 'var(--text-secondary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 700,
      fontSize: Math.round(size * 0.4),
      letterSpacing: '-0.01em',
      border: '1px solid var(--border-hairline)',
      boxShadow: ring ? '0 0 0 2px var(--surface-page), 0 0 0 4px var(--accent)' : 'none',
      ...style
    }
  }, rest), !src && initial);
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
/* Lucide — the product's icon set (lucide-react). In the browser we load the
   same library from CDN and render icon node data, so stroke width, colour and
   fill behave exactly as in src/components/ui/Icon.tsx.
   Names are PascalCase Lucide names: "ShieldCheck", "ArrowUpRight", "House".
   Plus the two hand-drawn brand glyphs Lucide dropped: "whatsapp", "instagram"
   (copied verbatim from the product source). */
const LUCIDE_URL = 'https://unpkg.com/lucide@0.446.0/dist/umd/lucide.min.js';
let lucideLoader = null;
function loadLucide() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.lucide) return Promise.resolve(window.lucide);
  if (!lucideLoader) {
    lucideLoader = new Promise(resolve => {
      const s = document.createElement('script');
      s.src = LUCIDE_URL;
      s.onload = () => resolve(window.lucide);
      s.onerror = () => resolve(null);
      document.head.appendChild(s);
    });
  }
  return lucideLoader;
}
function toKebab(n) {
  return String(n).replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/\s+/g, '-').toLowerCase();
}
function toPascal(n) {
  return String(n).replace(/(^|[-_\s])(\w)/g, (_, __, c) => c.toUpperCase());
}

/** Lucide ships several shapes across builds. Accept them all rather than guessing:
 *  [['path',{...}], …]  ·  ['svg',{...},[…]]  ·  [{tag,attr},…]  ·  { children: [...] } */
function normalize(raw) {
  if (!raw) return [];
  if (raw.icons) return [];
  if (Array.isArray(raw)) {
    if (raw.length === 3 && raw[0] === 'svg' && Array.isArray(raw[2])) return normalize(raw[2]);
    return raw.map(n => {
      if (Array.isArray(n)) return {
        tag: n[0],
        attrs: n[1] || {}
      };
      if (n && n.tag) return {
        tag: n.tag,
        attrs: n.attr || n.attrs || {}
      };
      return null;
    }).filter(Boolean);
  }
  if (Array.isArray(raw.children)) return normalize(raw.children);
  return [];
}
function Icon({
  name,
  size = 20,
  stroke = 1.5,
  color = 'currentColor',
  fill = 'none',
  style
}) {
  const [, force] = React.useState(0);
  React.useEffect(() => {
    if (typeof window !== 'undefined' && !window.lucide) loadLucide().then(() => force(n => n + 1));
  }, []);
  const base = {
    display: 'block',
    flexShrink: 0,
    ...style
  };
  if (name === 'whatsapp') {
    return /*#__PURE__*/React.createElement("svg", {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: color,
      strokeWidth: stroke,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      style: base
    }, /*#__PURE__*/React.createElement("path", {
      d: "M3 21l1.7-5A8.5 8.5 0 1 1 8 19.3z"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M8.6 8.3c-.2-.5-.4-.5-.6-.5h-.5c-.2 0-.5.1-.7.3-.3.3-.9.8-.9 2s.9 2.3 1 2.5c.1.2 1.7 2.8 4.3 3.8 2.1.8 2.5.7 3 .6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2l-.5-.3-1.4-.7c-.2-.1-.4-.1-.5.1l-.6.8c-.1.2-.3.2-.5.1a5.8 5.8 0 0 1-1.7-1c-.6-.6-1-1.2-1.2-1.4-.1-.2 0-.4.1-.5l.4-.4.2-.4v-.4z",
      fill: color,
      stroke: "none"
    }));
  }
  if (name === 'instagram') {
    return /*#__PURE__*/React.createElement("svg", {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: color,
      strokeWidth: stroke,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      style: base
    }, /*#__PURE__*/React.createElement("rect", {
      x: "3",
      y: "3",
      width: "18",
      height: "18",
      rx: "5"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "12",
      cy: "12",
      r: "4"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "17.2",
      cy: "6.8",
      r: "0.9",
      fill: color,
      stroke: "none"
    }));
  }
  const lib = typeof window !== 'undefined' ? window.lucide : null;
  const icons = lib && lib.icons;
  const raw = icons ? icons[name] || icons[toKebab(name)] || icons[toPascal(name)] : null;
  const children = normalize(raw);
  if (!children.length) return /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      display: 'block',
      flexShrink: 0,
      width: size,
      height: size,
      ...style
    }
  });
  return /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: fill,
    stroke: color,
    strokeWidth: stroke,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: base
  }, children.map((c, i) => React.createElement(c.tag, {
    key: i,
    ...c.attrs
  })));
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/content/SectionHeader.jsx
try { (() => {
function SectionHeader({
  title,
  caption,
  action = 'See all',
  onAction,
  icon,
  style
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("header", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 16,
      marginBottom: 14,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      minWidth: 0
    }
  }, caption && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: 'var(--text-muted)'
    }
  }, caption), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: 20,
      fontWeight: 600,
      letterSpacing: '-0.015em',
      color: 'var(--text-primary)',
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 18,
    color: "var(--accent)",
    stroke: 2.2
  }), title)), onAction !== undefined && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onAction,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      flexShrink: 0,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: 0,
      fontFamily: 'var(--font-sans)',
      fontSize: 13.5,
      fontWeight: 600,
      color: hover ? 'var(--accent-hover)' : 'var(--accent)'
    }
  }, action, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "ChevronRight",
    size: 15,
    color: "currentColor",
    stroke: 2.2
  })));
}
Object.assign(__ds_scope, { SectionHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/SectionHeader.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const sizes = {
  sm: {
    h: 38,
    px: 16,
    fs: 14
  },
  md: {
    h: 48,
    px: 22,
    fs: 15
  },
  lg: {
    h: 56,
    px: 28,
    fs: 16
  }
};
function variantStyle(variant, disabled) {
  if (disabled) return {
    background: 'var(--surface-tag)',
    color: 'var(--text-disabled)',
    border: '1px solid transparent'
  };
  switch (variant) {
    case 'secondary':
      return {
        background: 'var(--surface-tag)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-hairline)'
      };
    case 'ghost':
      return {
        background: 'transparent',
        color: 'var(--text-secondary)',
        border: '1px solid transparent'
      };
    case 'outline':
      return {
        background: 'transparent',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-strong)'
      };
    case 'destructive':
      return {
        background: 'var(--danger-tint)',
        color: 'var(--danger)',
        border: '1px solid rgba(255,92,92,0.32)'
      };
    default:
      return {
        background: 'var(--accent)',
        color: 'var(--text-on-accent)',
        border: '1px solid transparent'
      };
  }
}
function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  full,
  disabled,
  onClick,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  const s = sizes[size] || sizes.md;
  const v = variantStyle(variant, disabled);
  const bg = !disabled && hover ? variant === 'primary' ? 'var(--accent-hover)' : variant === 'ghost' ? 'var(--surface-tag)' : variant === 'secondary' ? 'var(--surface-elevated)' : v.background : v.background;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    onClick: disabled ? undefined : onClick,
    disabled: disabled,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setPress(false);
    },
    onMouseDown: () => setPress(true),
    onMouseUp: () => setPress(false),
    style: {
      height: s.h,
      padding: `0 ${s.px}px`,
      fontSize: s.fs,
      fontWeight: 600,
      fontFamily: 'var(--font-sans)',
      letterSpacing: '-0.01em',
      borderRadius: 'var(--radius-button)',
      border: v.border,
      background: bg,
      color: v.color,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      width: full ? '100%' : undefined,
      whiteSpace: 'nowrap',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transform: press ? 'scale(0.98)' : 'none',
      transition: 'background 160ms cubic-bezier(.32,.72,0,1), transform 110ms cubic-bezier(.32,.72,0,1)',
      ...style
    }
  }, rest), icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: s.fs + 3,
    stroke: 2
  }), children, iconRight && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconRight,
    size: s.fs + 3,
    stroke: 2
  }));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Formats a number as Naira. Never dollars. */
function formatNaira(value, {
  decimals = 0
} = {}) {
  const n = Number(value || 0);
  return '₦' + n.toLocaleString('en-NG', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}
function Input({
  label,
  hint,
  error,
  icon,
  value,
  defaultValue,
  placeholder,
  type = 'text',
  multiline,
  disabled,
  onChange,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const Tag = multiline ? 'textarea' : 'input';
  const borderColor = error ? 'var(--danger)' : focus ? 'var(--accent)' : 'var(--border-hairline)';
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      width: '100%',
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--text-secondary)'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: multiline ? 'flex-start' : 'center',
      gap: 10,
      background: 'var(--surface-input)',
      border: `1px solid ${borderColor}`,
      borderRadius: 'var(--radius-input)',
      padding: multiline ? '14px 16px' : '0 16px',
      height: multiline ? undefined : 52,
      opacity: disabled ? 0.55 : 1,
      boxShadow: focus && !error ? 'var(--accent-glow)' : 'none',
      transition: 'border-color 160ms, box-shadow 160ms'
    }
  }, icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 18,
    color: "var(--text-muted)",
    style: {
      marginTop: multiline ? 2 : 0
    }
  }), /*#__PURE__*/React.createElement(Tag, _extends({
    type: multiline ? undefined : type,
    rows: multiline ? 4 : undefined,
    value: value,
    defaultValue: defaultValue,
    placeholder: placeholder,
    disabled: disabled,
    onChange: onChange,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      minWidth: 0,
      background: 'transparent',
      border: 'none',
      outline: 'none',
      resize: multiline ? 'vertical' : undefined,
      color: 'var(--text-primary)',
      fontSize: 15,
      fontFamily: 'var(--font-sans)',
      lineHeight: 1.5,
      padding: 0
    }
  }, rest))), (hint || error) && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: error ? 'var(--danger)' : 'var(--text-muted)',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5
    }
  }, error && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "CircleAlert",
    size: 13,
    color: "var(--danger)"
  }), error || hint));
}
function NairaInput({
  label = 'Amount',
  value,
  onChange,
  hint,
  error,
  presets = [],
  disabled,
  style
}) {
  const [focus, setFocus] = React.useState(false);
  const [inner, setInner] = React.useState(value == null ? '' : String(value));
  const shown = value == null ? inner : String(value);
  const set = v => {
    const clean = String(v).replace(/[^\d]/g, '');
    setInner(clean);
    onChange && onChange(clean === '' ? null : Number(clean));
  };
  const grouped = shown === '' ? '' : Number(shown).toLocaleString('en-NG');
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      width: '100%',
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--text-secondary)'
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      height: 64,
      padding: '0 18px',
      background: 'var(--surface-input)',
      borderRadius: 'var(--radius-input)',
      border: `1px solid ${error ? 'var(--danger)' : focus ? 'var(--accent)' : 'var(--border-hairline)'}`,
      boxShadow: focus && !error ? 'var(--accent-glow)' : 'none',
      opacity: disabled ? 0.55 : 1,
      transition: 'border-color 160ms, box-shadow 160ms'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 26,
      fontWeight: 700,
      color: shown ? 'var(--text-primary)' : 'var(--text-muted)'
    }
  }, "\u20A6"), /*#__PURE__*/React.createElement("input", {
    inputMode: "numeric",
    value: grouped,
    placeholder: "0",
    disabled: disabled,
    onChange: e => set(e.target.value),
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      minWidth: 0,
      background: 'transparent',
      border: 'none',
      outline: 'none',
      padding: 0,
      color: 'var(--text-primary)',
      fontSize: 26,
      fontWeight: 700,
      letterSpacing: '-0.02em',
      fontFamily: 'var(--font-sans)',
      fontFeatureSettings: 'var(--font-feature-tabular)'
    }
  })), presets.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, presets.map(p => /*#__PURE__*/React.createElement("button", {
    key: p,
    type: "button",
    onClick: () => set(p),
    style: {
      height: 34,
      padding: '0 14px',
      borderRadius: 999,
      cursor: 'pointer',
      background: Number(shown) === p ? 'var(--accent-tint)' : 'var(--surface-tag)',
      border: `1px solid ${Number(shown) === p ? 'var(--border-accent)' : 'transparent'}`,
      color: Number(shown) === p ? 'var(--text-primary)' : 'var(--text-secondary)',
      fontSize: 13,
      fontWeight: 600,
      fontFamily: 'var(--font-sans)'
    }
  }, formatNaira(p)))), (hint || error) && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: error ? 'var(--danger)' : 'var(--text-muted)'
    }
  }, error || hint));
}
Object.assign(__ds_scope, { formatNaira, Input, NairaInput });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Input.jsx", error: String((e && e.message) || e) }); }

// components/content/PriceChip.jsx
try { (() => {
function PriceChip({
  amount,
  label = 'PPV',
  free = false,
  size = 'md',
  tone = 'glass',
  style
}) {
  const sm = size === 'sm';
  const tones = {
    glass: {
      background: 'rgba(11,10,13,0.62)',
      color: '#fff',
      border: '1px solid rgba(255,255,255,0.16)',
      backdropFilter: 'blur(10px)'
    },
    accent: {
      background: 'var(--accent)',
      color: 'var(--text-on-accent)',
      border: '1px solid transparent'
    },
    plain: {
      background: 'var(--surface-tag)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-hairline)'
    }
  };
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      height: sm ? 24 : 30,
      padding: sm ? '0 9px' : '0 12px',
      borderRadius: 999,
      fontSize: sm ? 11.5 : 13,
      fontWeight: 700,
      letterSpacing: '-0.01em',
      whiteSpace: 'nowrap',
      fontFeatureSettings: 'var(--font-feature-tabular)',
      ...tones[tone],
      ...style
    }
  }, free ? 'Free' : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    style: {
      opacity: 0.72,
      fontSize: sm ? 10 : 11,
      fontWeight: 700,
      letterSpacing: '0.05em',
      textTransform: 'uppercase'
    }
  }, label), __ds_scope.formatNaira(amount)));
}
function ComingSoonPill({
  children = 'Coming soon',
  style
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      height: 26,
      padding: '0 11px',
      borderRadius: 999,
      background: 'var(--warning-tint)',
      color: 'var(--warning)',
      border: '1px solid rgba(255,183,3,0.28)',
      fontSize: 11.5,
      fontWeight: 700,
      letterSpacing: '0.02em',
      whiteSpace: 'nowrap',
      ...style
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "Clock",
    size: 12,
    color: "var(--warning)",
    stroke: 2.2
  }), children);
}
function AccessBadge({
  children = 'VIP only',
  icon = 'Crown',
  style
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      height: 26,
      padding: '0 10px',
      borderRadius: 999,
      background: 'var(--accent-tint-strong)',
      color: '#fff',
      border: '1px solid var(--border-accent)',
      fontSize: 11.5,
      fontWeight: 700,
      backdropFilter: 'blur(8px)',
      whiteSpace: 'nowrap',
      ...style
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 12,
    color: "#fff",
    stroke: 2.2
  }), children);
}
Object.assign(__ds_scope, { PriceChip, ComingSoonPill, AccessBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/PriceChip.jsx", error: String((e && e.message) || e) }); }

// components/content/ContentCard.jsx
try { (() => {
const TYPE_ICON = {
  photos: 'Images',
  video: 'Play',
  audio: 'Headphones',
  course: 'GraduationCap',
  post: 'FileText',
  event: 'CalendarDays'
};
function ContentCard({
  state = 'free',
  title,
  subtitle,
  image,
  price,
  contentType = 'photos',
  badge,
  count,
  ratio = '4 / 5',
  onUnlock,
  onOpen,
  style
}) {
  const [hover, setHover] = React.useState(false);
  const locked = state === 'locked';
  return /*#__PURE__*/React.createElement("article", {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    onClick: locked ? onUnlock : onOpen,
    style: {
      position: 'relative',
      borderRadius: 'var(--radius-card)',
      overflow: 'hidden',
      background: 'var(--surface-card)',
      border: '1px solid var(--border-hairline)',
      cursor: 'pointer',
      transition: 'border-color 200ms cubic-bezier(.32,.72,0,1)',
      borderColor: hover ? 'var(--border-strong)' : 'var(--border-hairline)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      aspectRatio: ratio,
      overflow: 'hidden',
      background: 'var(--surface-tag)'
    }
  }, !image && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'repeating-linear-gradient(135deg, var(--surface-tag) 0 12px, var(--surface-card) 12px 24px)'
    }
  }, !locked && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 12,
      bottom: 12,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 11.5,
      fontWeight: 600,
      color: 'var(--text-muted)',
      letterSpacing: '0.03em'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "ImagePlus",
    size: 14,
    color: "var(--text-muted)"
  }), " Creator photo")), image && /*#__PURE__*/React.createElement("img", {
    src: image,
    alt: "",
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      filter: locked ? 'blur(18px) saturate(0.85) brightness(0.72)' : 'none',
      transform: locked ? 'scale(1.12)' : hover ? 'scale(1.03)' : 'scale(1)',
      transition: 'transform 420ms cubic-bezier(.32,.72,0,1)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(to top, rgba(11,10,13,0.88) 0%, rgba(11,10,13,0.32) 42%, transparent 68%)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 12,
      left: 12,
      right: 12,
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      height: 26,
      padding: '0 10px',
      borderRadius: 999,
      background: 'rgba(11,10,13,0.62)',
      border: '1px solid rgba(255,255,255,0.14)',
      backdropFilter: 'blur(10px)',
      color: '#fff',
      fontSize: 11.5,
      fontWeight: 600
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: TYPE_ICON[contentType] || 'FileText',
    size: 12,
    color: "#fff",
    stroke: 2
  }), count != null ? count : contentType), badge && /*#__PURE__*/React.createElement(__ds_scope.AccessBadge, {
    style: {
      marginLeft: 'auto'
    }
  }, badge)), locked && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 52,
      height: 52,
      borderRadius: 999,
      display: 'grid',
      placeItems: 'center',
      background: 'rgba(11,10,13,0.55)',
      border: '1px solid rgba(255,255,255,0.2)',
      backdropFilter: 'blur(8px)',
      transform: hover ? 'scale(1.06)' : 'scale(1)',
      transition: 'transform 220ms cubic-bezier(.32,.72,0,1)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "Lock",
    size: 22,
    color: "#fff",
    stroke: 2
  }))), state === 'unlocked' && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      bottom: 12,
      right: 12,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      height: 26,
      padding: '0 10px',
      borderRadius: 999,
      background: 'rgba(11,10,13,0.62)',
      border: '1px solid rgba(255,255,255,0.16)',
      backdropFilter: 'blur(10px)',
      color: '#fff',
      fontSize: 11.5,
      fontWeight: 700
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "LockOpen",
    size: 12,
    color: "var(--success)",
    stroke: 2.4
  }), " Unlocked")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 14,
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      flex: 1,
      fontSize: 16,
      fontWeight: 600,
      letterSpacing: '-0.01em',
      color: 'var(--text-primary)',
      lineHeight: 1.3
    }
  }, title), state === 'free' && /*#__PURE__*/React.createElement(__ds_scope.PriceChip, {
    free: true,
    tone: "plain",
    size: "sm"
  }), locked && price != null && /*#__PURE__*/React.createElement(__ds_scope.PriceChip, {
    amount: price,
    tone: "plain",
    size: "sm"
  })), subtitle && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 13.5,
      color: 'var(--text-secondary)',
      lineHeight: 1.4
    }
  }, subtitle), locked && /*#__PURE__*/React.createElement(__ds_scope.Button, {
    full: true,
    size: "sm",
    icon: "Lock",
    onClick: onUnlock,
    style: {
      marginTop: 10
    }
  }, "Unlock", price != null ? ` for ₦${Number(price).toLocaleString('en-NG')}` : '')));
}
Object.assign(__ds_scope, { ContentCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/ContentCard.jsx", error: String((e && e.message) || e) }); }

// components/feed/CategoryBar.jsx
try { (() => {
/** The 6 create-sheet post categories, mirroring the product's lib/posts.ts.
 *  `gated` = needs admin approval before publishing (3 of 6).
 *  `disabled` = temporarily closed to posting, abuse mitigation (mirrors the
 *  backend HubContentPolicy::RESTRICTED_CATEGORIES). "Buy" is a feed filter only. */
const MISUSE_REASON = 'Temporarily disabled due to misuse. It will return soon.';
const CATEGORIES = {
  Learn: {
    icon: 'GraduationCap',
    gated: false,
    disabled: true,
    disabledReason: MISUSE_REASON
  },
  Sell: {
    icon: 'Store',
    gated: false
  },
  Opportunity: {
    icon: 'Briefcase',
    gated: true
  },
  Event: {
    icon: 'CalendarDays',
    gated: true
  },
  Question: {
    icon: 'CircleHelp',
    gated: false,
    disabled: true,
    disabledReason: MISUSE_REASON
  },
  Research: {
    icon: 'FlaskConical',
    gated: true
  }
};
const FILTERS = ['All', 'Learn', 'Buy', 'Sell', 'Opportunity', 'Event', 'Question', 'Research'];
function CategoryTag({
  name,
  style
}) {
  const c = CATEGORIES[name] || {
    icon: 'Tag'
  };
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '3px 9px 3px 7px',
      borderRadius: 999,
      background: 'var(--surface-tag)',
      border: '1px solid var(--border-hairline)',
      color: 'var(--text-secondary)',
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.02em',
      whiteSpace: 'nowrap',
      ...style
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: c.icon,
    size: 12,
    color: "var(--text-secondary)"
  }), " ", name);
}
function CategoryBar({
  value = 'All',
  onChange,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      overflowX: 'auto',
      padding: '2px 0',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
      ...style
    },
    className: "wawu-no-scrollbar"
  }, FILTERS.map(f => {
    const on = value === f;
    return /*#__PURE__*/React.createElement("button", {
      key: f,
      type: "button",
      onClick: () => onChange && onChange(f),
      style: {
        flexShrink: 0,
        height: 36,
        padding: f === 'Buy' ? '0 15px 0 12px' : '0 15px',
        borderRadius: 999,
        cursor: 'pointer',
        fontSize: 13.5,
        fontWeight: 600,
        fontFamily: 'var(--font-sans)',
        background: on ? 'var(--accent)' : 'var(--surface-tag)',
        border: `1px solid ${on ? 'transparent' : 'var(--border-hairline)'}`,
        color: on ? 'var(--text-on-accent)' : 'var(--text-secondary)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        whiteSpace: 'nowrap',
        transition: 'background 160ms, color 160ms'
      }
    }, f === 'Buy' && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: "ShoppingBag",
      size: 14,
      color: "currentColor",
      stroke: 1.9
    }), f);
  }));
}
Object.assign(__ds_scope, { MISUSE_REASON, CATEGORIES, FILTERS, CategoryTag, CategoryBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feed/CategoryBar.jsx", error: String((e && e.message) || e) }); }

// components/feed/EngagementBar.jsx
try { (() => {
function EngagementBar({
  comments = 24,
  saved = false,
  rating = 4.9,
  onComment,
  onShare,
  onSave,
  onRate,
  style
}) {
  const [isSaved, setSaved] = React.useState(saved);
  const item = (icon, label, onClick, active, fill) => /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClick,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      height: 38,
      padding: '0 13px',
      borderRadius: 999,
      border: '1px solid transparent',
      cursor: 'pointer',
      background: active ? 'var(--accent-tint)' : 'transparent',
      color: active ? 'var(--accent-hover)' : 'var(--text-secondary)',
      fontSize: 13,
      fontWeight: 600,
      fontFamily: 'var(--font-sans)',
      transition: 'background 160ms, color 160ms'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 17,
    color: "currentColor",
    fill: fill && active ? 'currentColor' : 'none',
    stroke: active ? 2.2 : 1.8
  }), label);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      paddingTop: 10,
      borderTop: '1px solid var(--border-hairline)',
      ...style
    }
  }, item('MessageCircle', comments, onComment), item('Share2', 'Share', onShare), item('Bookmark', isSaved ? 'Saved' : 'Save', () => {
    setSaved(!isSaved);
    onSave && onSave(!isSaved);
  }, isSaved, true), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onRate,
    style: {
      marginLeft: 'auto',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      height: 38,
      padding: '0 13px',
      borderRadius: 999,
      border: '1px solid var(--border-hairline)',
      background: 'transparent',
      cursor: 'pointer',
      color: 'var(--text-primary)',
      fontSize: 13,
      fontWeight: 700,
      fontFamily: 'var(--font-sans)',
      fontFeatureSettings: 'var(--font-feature-tabular)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "Star",
    size: 15,
    color: "var(--brand-yellow)",
    fill: "var(--brand-yellow)",
    stroke: 0
  }), rating));
}
Object.assign(__ds_scope, { EngagementBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feed/EngagementBar.jsx", error: String((e && e.message) || e) }); }

// components/feed/StatusPill.jsx
try { (() => {
const STATUS = {
  success: {
    bg: 'var(--success-tint)',
    fg: 'var(--success)',
    border: 'rgba(184,232,62,0.3)'
  },
  error: {
    bg: 'var(--danger-tint)',
    fg: 'var(--danger)',
    border: 'rgba(255,92,92,0.3)'
  },
  warning: {
    bg: 'var(--warning-tint)',
    fg: 'var(--warning)',
    border: 'rgba(255,183,3,0.3)'
  },
  info: {
    bg: 'var(--info-tint)',
    fg: 'var(--info)',
    border: 'rgba(32,201,195,0.3)'
  },
  neutral: {
    bg: 'var(--surface-tag)',
    fg: 'var(--text-secondary)',
    border: 'var(--border-hairline)'
  }
};
function StatusPill({
  kind = 'info',
  children,
  style
}) {
  const c = STATUS[kind] || STATUS.info;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '5px 11px',
      borderRadius: 999,
      background: c.bg,
      color: c.fg,
      border: `1px solid ${c.border}`,
      fontSize: 12,
      fontWeight: 700,
      whiteSpace: 'nowrap',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 999,
      background: c.fg
    }
  }), children);
}
function HandoffPill({
  app = 'WAWUBasket',
  style
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '4px 10px',
      borderRadius: 999,
      background: 'transparent',
      border: '1px solid var(--border-hairline)',
      color: 'var(--text-muted)',
      fontSize: 11,
      fontWeight: 600,
      whiteSpace: 'nowrap',
      ...style
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "ArrowUpRight",
    size: 12,
    color: "var(--text-muted)",
    stroke: 2
  }), "Opens in ", app);
}
Object.assign(__ds_scope, { StatusPill, HandoffPill });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feed/StatusPill.jsx", error: String((e && e.message) || e) }); }

// components/feedback/EmptyState.jsx
try { (() => {
function EmptyState({
  icon = 'Inbox',
  title,
  caption,
  action,
  onAction,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      gap: 6,
      padding: '48px 24px',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 64,
      height: 64,
      borderRadius: 999,
      background: 'var(--accent-tint)',
      border: '1px solid var(--border-accent)',
      display: 'grid',
      placeItems: 'center',
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 26,
    color: "var(--accent-hover)",
    stroke: 1.8
  })), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontSize: 17,
      fontWeight: 700,
      letterSpacing: '-0.015em',
      color: 'var(--text-primary)'
    }
  }, title), caption && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 14,
      color: 'var(--text-secondary)',
      lineHeight: 1.5,
      maxWidth: 300
    }
  }, caption), action && /*#__PURE__*/React.createElement(__ds_scope.Button, {
    size: "sm",
    onClick: onAction,
    style: {
      marginTop: 14
    }
  }, action));
}
function ErrorState({
  title = 'Something went wrong',
  caption = 'Check your connection and try again.',
  onRetry,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      gap: 6,
      padding: '48px 24px',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 64,
      height: 64,
      borderRadius: 999,
      background: 'var(--danger-tint)',
      border: '1px solid rgba(255,92,92,0.3)',
      display: 'grid',
      placeItems: 'center',
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "TriangleAlert",
    size: 26,
    color: "var(--danger)",
    stroke: 1.9
  })), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontSize: 17,
      fontWeight: 700,
      letterSpacing: '-0.015em',
      color: 'var(--text-primary)'
    }
  }, title), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 14,
      color: 'var(--text-secondary)',
      lineHeight: 1.5,
      maxWidth: 300
    }
  }, caption), onRetry && /*#__PURE__*/React.createElement(__ds_scope.Button, {
    size: "sm",
    variant: "secondary",
    icon: "RotateCw",
    onClick: onRetry,
    style: {
      marginTop: 14
    }
  }, "Try again"));
}
const shimmer = {
  background: 'linear-gradient(90deg, var(--surface-tag) 25%, rgba(255,255,255,0.06) 50%, var(--surface-tag) 75%)',
  backgroundSize: '200% 100%',
  animation: 'wawuShimmer 1.4s linear infinite'
};
function Skeleton({
  variant = 'line',
  width,
  height,
  style
}) {
  if (variant === 'card') {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        borderRadius: 'var(--radius-card)',
        border: '1px solid var(--border-hairline)',
        overflow: 'hidden',
        background: 'var(--surface-card)',
        ...style
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        ...shimmer,
        aspectRatio: '4 / 5'
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 9
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        ...shimmer,
        height: 14,
        width: '72%',
        borderRadius: 6
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        ...shimmer,
        height: 11,
        width: '46%',
        borderRadius: 6
      }
    })));
  }
  if (variant === 'row') {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 13,
        padding: '13px 14px',
        ...style
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        ...shimmer,
        width: 40,
        height: 40,
        borderRadius: 12,
        flexShrink: 0
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        ...shimmer,
        height: 13,
        width: '58%',
        borderRadius: 6
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        ...shimmer,
        height: 10,
        width: '34%',
        borderRadius: 6
      }
    })));
  }
  if (variant === 'circle') {
    const d = width || height || 40;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        ...shimmer,
        width: d,
        height: d,
        borderRadius: 999,
        ...style
      }
    });
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      ...shimmer,
      width: width || '100%',
      height: height || 13,
      borderRadius: 6,
      ...style
    }
  });
}
Object.assign(__ds_scope, { EmptyState, ErrorState, Skeleton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/EmptyState.jsx", error: String((e && e.message) || e) }); }

// components/identity/VerificationBadge.jsx
try { (() => {
/** WAWU ID verification tiers, from the product's VERIFY_TIERS registry. */
const VERIFY_TIERS = {
  basic: {
    label: 'Basic',
    glyph: 'User',
    solid: false
  },
  verified_user: {
    label: 'Verified user',
    glyph: 'Check',
    solid: true
  },
  verified_business: {
    label: 'Verified business',
    glyph: 'Store',
    solid: true
  },
  certified_professional: {
    label: 'Certified professional',
    glyph: 'Award',
    solid: true
  },
  trusted_partner: {
    label: 'Trusted partner',
    glyph: 'ShieldCheck',
    solid: true,
    top: true
  },
  official: {
    label: 'WAWUAfrica official',
    glyph: 'ShieldCheck',
    solid: true,
    top: true
  }
};
const LEGACY = {
  verified: 'verified_user',
  business: 'verified_business',
  professional: 'certified_professional',
  partner: 'trusted_partner'
};
function canonicalTier(tier) {
  return !tier ? 'basic' : LEGACY[tier] || tier;
}
function VerificationBadge({
  tier = 'verified_user',
  size = 16,
  style
}) {
  const t = VERIFY_TIERS[canonicalTier(tier)];
  if (!t) return null;
  if (!t.solid) {
    return /*#__PURE__*/React.createElement("span", {
      title: t.label,
      style: {
        width: size,
        height: size,
        borderRadius: 999,
        flexShrink: 0,
        border: '1.5px solid var(--text-disabled)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style
      }
    }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: t.glyph,
      size: size * 0.6,
      color: "var(--text-muted)",
      stroke: 2
    }));
  }
  return /*#__PURE__*/React.createElement("span", {
    title: t.label,
    style: {
      width: size,
      height: size,
      borderRadius: t.top ? size * 0.3 : 999,
      flexShrink: 0,
      background: 'var(--accent)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: t.top ? '0 0 0 1.5px var(--surface-page), 0 0 0 3px var(--accent)' : 'none',
      ...style
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: t.glyph,
    size: size * 0.62,
    color: "#fff",
    stroke: 2.4
  }));
}
const TIERS = {
  basic: {
    label: 'Basic',
    icon: 'Circle',
    bg: 'var(--accent-tint)',
    fg: '#C77BE8',
    border: 'var(--border-accent)'
  },
  pro: {
    label: 'Pro',
    icon: 'Crown',
    bg: 'rgba(255,183,3,0.14)',
    fg: 'var(--brand-yellow)',
    border: 'rgba(255,183,3,0.34)'
  }
};
function TierBadge({
  tier = 'basic',
  label,
  size = 'md',
  style
}) {
  const t = TIERS[tier] || TIERS.basic;
  const sm = size === 'sm';
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      height: sm ? 22 : 26,
      padding: sm ? '0 9px' : '0 11px',
      borderRadius: 999,
      background: t.bg,
      color: t.fg,
      border: `1px solid ${t.border}`,
      fontSize: sm ? 11 : 12,
      fontWeight: 700,
      letterSpacing: '0.01em',
      whiteSpace: 'nowrap',
      ...style
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: t.icon,
    size: sm ? 11 : 12,
    color: t.fg,
    stroke: 2.4,
    fill: tier === 'pro' ? t.fg : 'none'
  }), label || t.label);
}
function StatBlock({
  value,
  label,
  align = 'center',
  size = 'md',
  style
}) {
  const sizes = {
    sm: 18,
    md: 24,
    lg: 34
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      alignItems: align === 'center' ? 'center' : 'flex-start',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: sizes[size],
      fontWeight: 700,
      letterSpacing: '-0.025em',
      color: 'var(--text-primary)',
      lineHeight: 1.1,
      fontFeatureSettings: 'var(--font-feature-tabular)'
    }
  }, value), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      color: 'var(--text-muted)'
    }
  }, label));
}
Object.assign(__ds_scope, { VERIFY_TIERS, canonicalTier, VerificationBadge, TierBadge, StatBlock });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/identity/VerificationBadge.jsx", error: String((e && e.message) || e) }); }

// components/identity/ProfileHeader.jsx
try { (() => {
function ProfileHeader({
  name,
  handle,
  bio,
  avatar,
  cover,
  tier = 'verified_user',
  plan = 'basic',
  stats = [],
  primaryAction = 'Subscribe',
  onPrimary,
  onMessage,
  onShare,
  following = false,
  style
}) {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      background: 'var(--surface-card)',
      borderBottom: '1px solid var(--border-hairline)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height: 132,
      background: cover ? `center/cover url(${cover})` : 'linear-gradient(135deg, var(--accent-deep), var(--accent))'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(to top, rgba(11,10,13,0.9), rgba(11,10,13,0.1))'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 18px 18px',
      marginTop: -38,
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Avatar, {
    src: avatar,
    initial: (name || '?')[0],
    size: 84,
    ring: true
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontSize: 22,
      fontWeight: 700,
      letterSpacing: '-0.02em',
      color: 'var(--text-primary)'
    }
  }, name), /*#__PURE__*/React.createElement(__ds_scope.VerificationBadge, {
    tier: tier,
    size: 18
  }), /*#__PURE__*/React.createElement(__ds_scope.TierBadge, {
    tier: plan,
    size: "sm"
  })), handle && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '3px 0 0',
      fontSize: 14,
      color: 'var(--text-muted)'
    }
  }, "@", handle), bio && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '10px 0 0',
      fontSize: 14.5,
      lineHeight: 1.5,
      color: 'var(--text-secondary)',
      maxWidth: 560
    }
  }, bio), stats.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 28,
      marginTop: 16,
      paddingTop: 16,
      borderTop: '1px solid var(--border-hairline)'
    }
  }, stats.map(s => /*#__PURE__*/React.createElement(__ds_scope.StatBlock, {
    key: s.label,
    value: s.value,
    label: s.label,
    align: "start",
    size: "sm"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Button, {
    onClick: onPrimary,
    variant: following ? 'secondary' : 'primary',
    style: {
      flex: 1
    }
  }, following ? 'Following' : primaryAction), onMessage && /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "secondary",
    onClick: onMessage,
    icon: "Bell",
    "aria-label": "Notify me",
    style: {
      width: 48,
      padding: 0
    }
  }), onShare && /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "secondary",
    onClick: onShare,
    icon: "Share2",
    "aria-label": "Share",
    style: {
      width: 48,
      padding: 0
    }
  }))));
}
Object.assign(__ds_scope, { ProfileHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/identity/ProfileHeader.jsx", error: String((e && e.message) || e) }); }

// components/lists/ListRow.jsx
try { (() => {
function ListRow({
  title,
  subtitle,
  icon,
  thumb,
  meta,
  badge,
  trailing = 'chevron',
  disabled,
  onClick,
  style
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: disabled ? undefined : onClick,
    disabled: disabled,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 13,
      width: '100%',
      textAlign: 'left',
      padding: '13px 14px',
      borderRadius: 'var(--radius-input)',
      border: '1px solid transparent',
      background: hover && !disabled ? 'var(--surface-tag)' : 'transparent',
      cursor: disabled ? 'default' : 'pointer',
      opacity: disabled ? 0.55 : 1,
      fontFamily: 'var(--font-sans)',
      transition: 'background 160ms',
      ...style
    }
  }, thumb ? /*#__PURE__*/React.createElement("img", {
    src: thumb,
    alt: "",
    style: {
      width: 44,
      height: 44,
      borderRadius: 12,
      objectFit: 'cover',
      flexShrink: 0
    }
  }) : icon ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: 40,
      height: 40,
      borderRadius: 12,
      flexShrink: 0,
      background: 'var(--surface-tag)',
      border: '1px solid var(--border-hairline)',
      display: 'grid',
      placeItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 18,
    color: "var(--accent)",
    stroke: 2
  })) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 3
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 600,
      color: 'var(--text-primary)',
      letterSpacing: '-0.01em'
    }
  }, title), badge), subtitle && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--text-secondary)',
      lineHeight: 1.4,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, subtitle)), meta && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13.5,
      fontWeight: 700,
      color: 'var(--text-primary)',
      flexShrink: 0,
      fontFeatureSettings: 'var(--font-feature-tabular)'
    }
  }, meta), trailing === 'chevron' && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "ChevronRight",
    size: 17,
    color: "var(--text-muted)",
    stroke: 2
  }), trailing === 'external' && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "ArrowUpRight",
    size: 17,
    color: "var(--text-muted)",
    stroke: 2
  }));
}
Object.assign(__ds_scope, { ListRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/lists/ListRow.jsx", error: String((e && e.message) || e) }); }

// components/overlay/Sheet.jsx
try { (() => {
function Sheet({
  open = true,
  variant = 'sheet',
  title,
  caption,
  onClose,
  children,
  footer,
  style
}) {
  if (!open) return null;
  const isModal = variant === 'modal';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      zIndex: 60,
      display: 'flex',
      alignItems: isModal ? 'center' : 'flex-end',
      justifyContent: 'center',
      padding: isModal ? 20 : 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: 'absolute',
      inset: 0,
      background: 'var(--surface-scrim)',
      backdropFilter: 'blur(3px)'
    }
  }), /*#__PURE__*/React.createElement("section", {
    style: {
      position: 'relative',
      width: '100%',
      maxWidth: isModal ? 400 : undefined,
      background: 'var(--surface-elevated)',
      border: '1px solid var(--border-hairline)',
      borderRadius: isModal ? 'var(--radius-card)' : 'var(--radius-sheet) var(--radius-sheet) 0 0',
      boxShadow: isModal ? 'var(--shadow-float)' : 'var(--shadow-sheet)',
      padding: isModal ? 22 : '10px 20px calc(20px + env(safe-area-inset-bottom))',
      animation: `${isModal ? 'wawuFadeUp' : 'wawuSheetIn'} 320ms cubic-bezier(.32,.72,0,1)`,
      maxHeight: '88%',
      overflowY: 'auto',
      ...style
    }
  }, !isModal && /*#__PURE__*/React.createElement("div", {
    style: {
      width: 38,
      height: 4,
      borderRadius: 999,
      background: 'var(--border-strong)',
      margin: '0 auto 16px'
    }
  }), (title || onClose) && /*#__PURE__*/React.createElement("header", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      marginBottom: caption ? 6 : 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, title && /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: 19,
      fontWeight: 700,
      letterSpacing: '-0.02em',
      color: 'var(--text-primary)'
    }
  }, title), caption && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '5px 0 0',
      fontSize: 13.5,
      color: 'var(--text-secondary)',
      lineHeight: 1.45
    }
  }, caption)), onClose && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClose,
    "aria-label": "Close",
    style: {
      width: 32,
      height: 32,
      borderRadius: 999,
      border: 'none',
      cursor: 'pointer',
      background: 'var(--surface-tag)',
      display: 'grid',
      placeItems: 'center',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "X",
    size: 16,
    color: "var(--text-secondary)",
    stroke: 2.2
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: caption ? 16 : 0
    }
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      marginTop: 20
    }
  }, footer)));
}
Object.assign(__ds_scope, { Sheet });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/overlay/Sheet.jsx", error: String((e && e.message) || e) }); }

// components/trust/TrustScoreChip.jsx
try { (() => {
/** Point-based trust tiers, from the product's locked Phase-3 model. */
const TRUST_TIERS = [{
  name: 'Basic',
  min: 0
}, {
  name: 'Verified',
  min: 100
}, {
  name: 'Gold',
  min: 500
}, {
  name: 'Elite',
  min: 1500
}, {
  name: 'Trusted Partner',
  min: 5000
}];
function fmtPts(n) {
  return Number(n || 0).toLocaleString('en-NG');
}
function nextTierInfo(pts) {
  let i = 0;
  for (let k = 0; k < TRUST_TIERS.length; k++) if (pts >= TRUST_TIERS[k].min) i = k;
  const tier = TRUST_TIERS[i];
  const next = TRUST_TIERS[i + 1] || null;
  const frac = next ? (pts - tier.min) / (next.min - tier.min) : 1;
  return {
    i,
    tier,
    next,
    frac: Math.max(0, Math.min(1, frac)),
    need: next ? next.min - pts : 0
  };
}
function TrustScoreChip({
  points = 1240,
  size = 'md',
  style
}) {
  const sm = size === 'sm';
  const {
    tier
  } = nextTierInfo(points);
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: sm ? 5 : 7,
      padding: sm ? '3px 4px 3px 9px' : '4px 5px 4px 11px',
      borderRadius: 999,
      background: 'var(--surface-tag)',
      border: '1px solid var(--border-hairline)',
      color: 'var(--text-primary)',
      fontSize: sm ? 11.5 : 13,
      fontWeight: 700,
      fontFeatureSettings: 'var(--font-feature-tabular)',
      whiteSpace: 'nowrap',
      ...style
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "ShieldCheck",
    size: sm ? 12 : 14,
    color: "var(--accent)",
    stroke: 2.2
  }), fmtPts(points), /*#__PURE__*/React.createElement("span", {
    style: {
      padding: sm ? '2px 7px' : '3px 9px',
      borderRadius: 999,
      background: 'var(--accent)',
      color: 'var(--text-on-accent)',
      fontSize: sm ? 10 : 11,
      fontWeight: 700
    }
  }, tier.name));
}
Object.assign(__ds_scope, { TRUST_TIERS, fmtPts, nextTierInfo, TrustScoreChip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/trust/TrustScoreChip.jsx", error: String((e && e.message) || e) }); }

// components/trust/TrustMeter.jsx
try { (() => {
const TRUST_EARNS = [{
  label: 'Course completion',
  points: '+50',
  icon: 'GraduationCap'
}, {
  label: 'Purchase',
  points: '+20',
  icon: 'ShoppingBag'
}, {
  label: 'Sale via Basket or Beauty',
  points: '+20',
  icon: 'Tag'
}, {
  label: 'Helpful contribution',
  points: '+10',
  icon: 'ThumbsUp'
}, {
  label: 'Positive rating',
  points: '+15',
  icon: 'Star'
}, {
  label: 'Verified info',
  points: '+30',
  icon: 'ShieldCheck'
}];
const TRUST_LOSES = [{
  label: 'Spam',
  points: '-100',
  icon: 'TriangleAlert'
}, {
  label: 'Fraud',
  points: '-200',
  icon: 'Ban'
}, {
  label: 'False information',
  points: '-100',
  icon: 'CircleX'
}, {
  label: 'Offensive language',
  points: '-50',
  icon: 'MessageSquareOff'
}, {
  label: 'Policy violation',
  points: '-150',
  icon: 'ShieldOff'
}];
const cap = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)'
};
function Row({
  r,
  negative
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '9px 0'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: r.icon,
    size: 16,
    color: negative ? 'var(--danger)' : 'var(--text-secondary)'
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 13.5,
      color: 'var(--text-primary)'
    }
  }, r.label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: negative ? 'var(--danger)' : 'var(--success)',
      fontFeatureSettings: 'var(--font-feature-tabular)'
    }
  }, r.points));
}
function TrustMeter({
  points = 1240,
  breakdown = false,
  style
}) {
  const {
    tier,
    next,
    frac,
    need
  } = __ds_scope.nextTierInfo(points);
  return /*#__PURE__*/React.createElement("section", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      background: 'var(--surface-card)',
      border: '1px solid var(--border-hairline)',
      borderRadius: 'var(--radius-card)',
      padding: 18,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 3
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: cap
  }, "Trust score"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 34,
      fontWeight: 700,
      letterSpacing: '-0.03em',
      color: 'var(--text-primary)',
      lineHeight: 1.05,
      fontFeatureSettings: 'var(--font-feature-tabular)'
    }
  }, __ds_scope.fmtPts(points))), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '7px 13px',
      borderRadius: 999,
      background: 'var(--accent)',
      color: 'var(--text-on-accent)',
      fontSize: 12,
      fontWeight: 700
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "ShieldCheck",
    size: 13,
    color: "#fff",
    stroke: 2.2
  }), " ", tier.name)), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height: 8,
      borderRadius: 999,
      background: 'var(--surface-tag)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      width: `${frac * 100}%`,
      borderRadius: 999,
      background: 'linear-gradient(90deg, var(--accent-deep), var(--accent))'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-secondary)'
    }
  }, next ? `${__ds_scope.fmtPts(need)} points to ${next.name}` : 'Top tier reached'), next && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-disabled)'
    }
  }, __ds_scope.fmtPts(next.min))), breakdown && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...cap,
      marginTop: 6
    }
  }, "What earns points"), /*#__PURE__*/React.createElement("div", null, TRUST_EARNS.map(r => /*#__PURE__*/React.createElement(Row, {
    key: r.label,
    r: r
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: 'var(--border-hairline)',
      margin: '6px 0'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: cap
  }, "What loses points"), /*#__PURE__*/React.createElement("div", null, TRUST_LOSES.map(r => /*#__PURE__*/React.createElement(Row, {
    key: r.label,
    r: r,
    negative: true
  })))));
}
Object.assign(__ds_scope, { TRUST_EARNS, TRUST_LOSES, TrustMeter });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/trust/TrustMeter.jsx", error: String((e && e.message) || e) }); }

__ds_ns.ContentCard = __ds_scope.ContentCard;

__ds_ns.PriceChip = __ds_scope.PriceChip;

__ds_ns.ComingSoonPill = __ds_scope.ComingSoonPill;

__ds_ns.AccessBadge = __ds_scope.AccessBadge;

__ds_ns.SectionHeader = __ds_scope.SectionHeader;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.NairaInput = __ds_scope.NairaInput;

__ds_ns.MISUSE_REASON = __ds_scope.MISUSE_REASON;

__ds_ns.CATEGORIES = __ds_scope.CATEGORIES;

__ds_ns.FILTERS = __ds_scope.FILTERS;

__ds_ns.CategoryTag = __ds_scope.CategoryTag;

__ds_ns.CategoryBar = __ds_scope.CategoryBar;

__ds_ns.EngagementBar = __ds_scope.EngagementBar;

__ds_ns.StatusPill = __ds_scope.StatusPill;

__ds_ns.HandoffPill = __ds_scope.HandoffPill;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.ErrorState = __ds_scope.ErrorState;

__ds_ns.Skeleton = __ds_scope.Skeleton;

__ds_ns.ProfileHeader = __ds_scope.ProfileHeader;

__ds_ns.VERIFY_TIERS = __ds_scope.VERIFY_TIERS;

__ds_ns.VerificationBadge = __ds_scope.VerificationBadge;

__ds_ns.TierBadge = __ds_scope.TierBadge;

__ds_ns.StatBlock = __ds_scope.StatBlock;

__ds_ns.ListRow = __ds_scope.ListRow;

__ds_ns.Sheet = __ds_scope.Sheet;

__ds_ns.TRUST_EARNS = __ds_scope.TRUST_EARNS;

__ds_ns.TRUST_LOSES = __ds_scope.TRUST_LOSES;

__ds_ns.TrustMeter = __ds_scope.TrustMeter;

__ds_ns.TRUST_TIERS = __ds_scope.TRUST_TIERS;

__ds_ns.TrustScoreChip = __ds_scope.TrustScoreChip;

})();
