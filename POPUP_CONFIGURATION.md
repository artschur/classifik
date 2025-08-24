# Global Popup Configuration

This document explains how to configure the global popup system that appears on all pages.

## Quick Setup

The popup is configured directly in your `app/layout.tsx` file. Simply uncomment and customize the `GlobalPopupWrapper` component:

```tsx
{
  /* Global Popup - Uncomment and customize as needed */
}
<GlobalPopupWrapper
  isEnabled={true}
  title="Welcome to Our Platform!"
  description="We've made some exciting updates to improve your experience. Check out our new features!"
  confirmText="Got it!"
  cancelText="Learn More"
  showCloseButton={true}
  persistent={false}
  storageKey="welcome-popup-dismissed"
/>;
```

## Configuration Options

### Basic Configuration

```tsx
<GlobalPopupWrapper
  isEnabled={true} // Enable/disable the popup
  title="Your Title" // Popup title
  description="Your description" // Popup description
  confirmText="Confirm" // Confirm button text
  cancelText="Cancel" // Cancel button text (optional)
/>
```

### Advanced Configuration

```tsx
<GlobalPopupWrapper
  isEnabled={true}
  title="Important Notice"
  description="This is an important message for all users."
  confirmText="I Understand"
  cancelText="Learn More"
  showCloseButton={true} // Show/hide the X close button
  persistent={false} // If true, shows every time (no dismissal memory)
  storageKey="custom-popup-key" // Custom storage key for dismissal tracking
/>
```

## Usage Examples

### Simple Welcome Message

```tsx
<GlobalPopupWrapper
  isEnabled={true}
  title="Welcome!"
  description="Thank you for visiting our platform."
  confirmText="Continue"
/>
```

### Important Announcement (Persistent)

```tsx
<GlobalPopupWrapper
  isEnabled={true}
  title="Important Update"
  description="We will be performing maintenance on Sunday at 2 AM."
  confirmText="I Understand"
  persistent={true} // Shows every time
/>
```

### Promotional Message

```tsx
<GlobalPopupWrapper
  isEnabled={true}
  title="Special Offer!"
  description="Get 20% off your first purchase with code WELCOME20"
  confirmText="Claim Offer"
  cancelText="Maybe Later"
  showCloseButton={true}
/>
```

### Maintenance Notice

```tsx
<GlobalPopupWrapper
  isEnabled={true}
  title="Scheduled Maintenance"
  description="Our platform will be temporarily unavailable on Sunday from 2-4 AM for maintenance."
  confirmText="Got it"
  persistent={false}
  storageKey="maintenance-notice-dismissed"
/>
```

## Features

- **Easy to enable/disable**: Just comment/uncomment the component
- **Fully customizable**: Title, description, button text, behavior
- **Smart dismissal**: Remembers when users dismiss (unless persistent)
- **Responsive design**: Works on all screen sizes
- **Accessible**: Follows accessibility best practices
- **Type-safe**: Full TypeScript support

## Customization

To add custom logic when users interact with the popup, edit the `GlobalPopupWrapper` component in `components/global-popup-wrapper.tsx`:

```typescript
const handleConfirm = () => {
  // Add your custom logic here
  console.log('User confirmed popup');
  // Example: track analytics, redirect, etc.
};

const handleCancel = () => {
  // Add your custom logic here
  console.log('User cancelled popup');
};

const handleClose = () => {
  // Add your custom logic here
  console.log('User closed popup');
};
```

## Disabling the Popup

To disable the popup, simply comment out the component in `app/layout.tsx`:

```tsx
{
  /* 
<GlobalPopupWrapper
  isEnabled={true}
  title="Welcome to Our Platform!"
  description="We've made some exciting updates!"
  confirmText="Got it!"
/>
*/
}
```

Or set `isEnabled={false}`:

```tsx
<GlobalPopupWrapper
  isEnabled={false} // This disables the popup
  title="Welcome to Our Platform!"
  description="We've made some exciting updates!"
  confirmText="Got it!"
/>
```

## Multiple Popups

You can have multiple popups by using different `storageKey` values:

```tsx
{
  /* Welcome popup */
}
<GlobalPopupWrapper
  isEnabled={true}
  title="Welcome!"
  description="Welcome to our platform!"
  confirmText="Continue"
  storageKey="welcome-popup-dismissed"
/>;

{
  /* Feature announcement popup */
}
<GlobalPopupWrapper
  isEnabled={true}
  title="New Features!"
  description="Check out our latest features."
  confirmText="Explore"
  storageKey="features-popup-dismissed"
/>;
```
