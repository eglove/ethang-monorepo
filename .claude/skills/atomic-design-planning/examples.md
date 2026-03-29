# Atomic Design Planning Examples

## Example 1: Building a Comment Feature

### Analysis
```
Existing atoms to REUSE (don't recreate!):
├── Avatar        → Use with size="sm" prop
├── Button        → Use with variant="primary" prop
├── TextArea      → Use with placeholder prop
└── Timestamp     → Use with relative={true} prop

New molecule to CREATE:
└── CommentInput
    ├── Uses: Avatar + TextArea + Button
    └── Props: onSubmit, placeholder, user

New organism to CREATE:
└── CommentThread
    ├── Uses: CommentInput + list of Comment molecules
    └── Props: comments[], onAddComment, currentUser

DO NOT CREATE (anti-patterns):
├── CommentAvatar     → Just use Avatar with props!
├── CommentButton     → Just use Button with props!
├── CommentTextArea   → Just use TextArea with props!
└── CommentTimestamp  → Just use Timestamp with props!
```

---

## Example 2: Building a Product Card

### Analysis
```
Existing atoms to REUSE:
├── Image         → Use with aspectRatio="square" prop
├── Badge         → Use with variant="sale" prop
├── Text          → Use with size variants
├── Button        → Use with variant="secondary" prop
└── Icon          → Use with name="heart" for wishlist

New molecule to CREATE:
└── PriceDisplay
    ├── Uses: Text atoms for price, original price, discount
    └── Props: price, originalPrice, currency

New organism to CREATE:
└── ProductCard
    ├── Uses: Image + Badge + PriceDisplay + Button + Icon
    └── Props: product, onAddToCart, onWishlist

DO NOT CREATE:
├── ProductImage      → Image with aspectRatio prop
├── ProductBadge      → Badge with variant="sale"
└── ProductPrice      → This IS worth creating as PriceDisplay molecule
```

---

## Example 3: Building a Dashboard

### Analysis
```
Templates to use/create:
└── DashboardLayout
    ├── Header slot (organism)
    ├── Sidebar slot (organism)
    └── Content slot (flexible)

Organisms to create:
├── DashboardHeader
│   ├── Uses: Logo, NavItem molecules, Avatar
│   └── Props: user, navigation[]
│
├── DashboardSidebar
│   ├── Uses: NavItem molecules, Divider atom
│   └── Props: menuItems[], activeItem
│
├── MetricsCard
│   ├── Uses: Text, Icon, Trend molecule
│   └── Props: title, value, trend, icon
│
└── ActivityFeed
    ├── Uses: ActivityItem molecules
    └── Props: activities[], onLoadMore

Molecules needed:
├── NavItem (may exist)
├── Trend (new: arrow + percentage)
└── ActivityItem (new: avatar + text + timestamp)
```

---

## Anti-Pattern Examples

### Anti-Pattern 1: Feature-Specific Atoms
```
❌ WRONG:
atoms/
├── UserProfileButton.tsx    → This is an organism!
├── ShoppingCartIcon.tsx     → Just use Icon with name prop
└── LoginEmailInput.tsx      → Just use Input with type="email"

✓ CORRECT:
atoms/
├── Button.tsx               → Generic, with variants
├── Icon.tsx                 → Generic, with name prop
└── Input.tsx                → Generic, with type prop
```

### Anti-Pattern 2: Skipping Molecule Level
```
❌ WRONG:
organisms/
└── LoginForm.tsx
    └── Directly uses: Label, Input, Button atoms

✓ CORRECT:
molecules/
└── FormField.tsx
    └── Uses: Label + Input + ErrorMessage atoms

organisms/
└── LoginForm.tsx
    └── Uses: FormField molecules + Button atom
```

### Anti-Pattern 3: God Organisms
```
❌ WRONG:
organisms/
└── ProductPage.tsx          → This is a PAGE, not organism!
    └── Contains everything: header, product, reviews, cart

✓ CORRECT:
pages/
└── ProductPage.tsx
    └── Uses: ProductHeader, ProductDetails, ReviewSection, CartSidebar organisms
```

---

## Decision Flowchart

```
Does this component exist already?
├── YES → Use it with props
└── NO ↓

Is it a basic HTML wrapper with styling?
├── YES → It's an ATOM
└── NO ↓

Does it combine 2-4 atoms with simple logic?
├── YES → It's a MOLECULE
└── NO ↓

Is it a complete, distinct UI section?
├── YES → It's an ORGANISM
└── NO ↓

Does it define page structure without content?
├── YES → It's a TEMPLATE
└── NO → It's probably a PAGE
```
