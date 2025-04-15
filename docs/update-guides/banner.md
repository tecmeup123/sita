# Updating the Banner

The banner is defined in `token-issuer.tsx`:

```
client/src/pages/token-issuer.tsx
```

## How to Update the Banner Image

1. **Add the new image file:**
   - Upload your new banner image to `client/src/assets/` or the attached assets folder
   - For optimal display, use an image with dimensions similar to the existing banner (approximately 500 x 150 px)
   - Use a format like PNG with transparency if needed

2. **Update the import:**
   - Locate the import statement at the top of `token-issuer.tsx`:
   ```typescript
   import BtcfiUnleashedBanner from "@assets/your-new-image.png";
   ```
   - Change the path to your new image file

## Banner Component Structure

The banner is structured as follows:

```jsx
<div className={`w-full rounded-xl overflow-hidden shadow-lg bg-orange-500`}>
  <div className="py-2 px-4 flex flex-col items-center justify-center relative">
    <div className="flex flex-col items-center w-full">
      <div className="relative w-full flex justify-center">
        <img 
          src={BtcfiUnleashedBanner} 
          alt="BTCFI UNLEASHED - Powered by Nervos Network" 
          className="h-auto max-h-20 md:max-h-24 w-auto mx-auto"
        />
        {/* RGB++ Badge */}
        <div className="absolute top-0 right-1 rounded-full bg-white px-2 py-0.5 border-2 border-white flex items-center" style={{ fontSize: '0.65rem' }}>
          <span className="font-bold mr-px text-red-600">R</span>
          <span className="font-bold mr-px text-green-600">G</span>
          <span className="font-bold mr-px text-blue-600">B</span>
          <span className="font-bold text-black">++</span>
        </div>
      </div>
      <button 
        onClick={() => {
          // Create and dispatch a custom event to open the FAQBot
          const openFAQBotEvent = new CustomEvent('open-faqbot');
          window.dispatchEvent(openFAQBotEvent);
        }}
        className="mt-2 px-4 py-1 bg-white text-orange-600 hover:bg-gray-100 transition-colors duration-200 ease-in-out rounded-md font-medium text-sm shadow-sm"
      >
        {language === 'en' ? 'Learn More' : 
         language === 'zh' ? '了解更多' :
         language === 'es' ? 'Saber más' :
         language === 'pt' ? 'Saiba Mais' :
         language === 'fr' ? 'En Savoir Plus' :
         language === 'it' ? 'Scopri di Più' : 'Learn More'}
      </button>
    </div>
  </div>
</div>
```

## Customizing the Banner

1. **To change the background color:**
   - Modify the `bg-orange-500` class in the outer div
   - You can use any Tailwind color class (e.g., `bg-blue-500`, `bg-green-500`)

2. **To modify the "Learn More" button:**
   - Update the button's styling classes
   - Ensure all language translations are updated

3. **To update the RGB++ badge:**
   - The badge is positioned with `absolute` positioning
   - Adjust `top` and `right` values to reposition it
   - Modify the styling as needed, but keep the RGB colors consistent

4. **To adjust banner dimensions:**
   - Modify the `max-h-20 md:max-h-24` classes to change the height
   - The width is set to auto and will respect the image's aspect ratio

## Important Notes

- The banner is responsive and will adjust to different screen sizes
- The image is centered using Flexbox
- Test the banner on mobile and desktop views after changes
- The "Learn More" button opens the FAQBot component
- Maintain the accessibility attributes (`alt` text) when changing the image