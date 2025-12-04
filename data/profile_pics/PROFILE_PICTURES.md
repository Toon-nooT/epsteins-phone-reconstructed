# Profile Pictures Implementation Guide

## ✅ What's Been Implemented

### 1. Profile Picture Display
- **Contact List**: Displays profile pictures in 40x40px circular avatars
- **Fallback System**: Shows initials if image is missing or fails to load
- **iOS Styling**: Matches native iOS Messages app appearance

### 2. File Structure
```
data/profile_pics/
├── lisa new.jpg          ✅ Already added
├── steve bannon.jpg      ⚠️  To be added
├── ken starr.jpg         ⚠️  To be added
└── sources.txt           ✅ Source tracking
```

### 3. Legal & Attribution
- **ATTRIBUTIONS.md**: Comprehensive attribution documentation
- **Fair Use Policy**: Legal framework for educational use
- **Takedown Policy**: Clear procedures for copyright holders
- **Footer Link**: Attribution link in app interface

### 4. Technical Implementation
- **Automatic Loading**: Images load based on contact name
- **Error Handling**: Graceful fallback to initials
- **Offline Support**: Images cached by service worker
- **Responsive Design**: Works on all screen sizes

---

## 📝 How to Add More Profile Pictures

### Step 1: Get the Image
1. Find a high-quality photo (minimum 200x200px)
2. Save as JPG format
3. Keep file size under 100KB if possible

### Step 2: Name the File
Use the **exact contact name in lowercase**:
- "Steve Bannon" → `steve bannon.jpg`
- "Ken Starr" → `ken starr.jpg`

### Step 3: Add to Directory
Place file in: `data/profile_pics/`

### Step 4: Document the Source
Update `data/profile_pics/sources.txt`:
```
steve bannon: [URL where you found it]
ken starr: [URL where you found it]
```

### Step 5: Update Attribution
Edit `ATTRIBUTIONS.md` and add:
```markdown
### Steve Bannon
- **Source**: [Description]
- **URL**: [URL]
- **Date Retrieved**: [Date]
- **License**: Educational fair use
```

### Step 6: Update Service Worker (Optional)
If you want offline support, edit `sw.js`:
```javascript
const ASSETS_TO_CACHE = [
    // ... existing entries
    './data/profile_pics/steve bannon.jpg',
    './data/profile_pics/ken starr.jpg'
];
```

Then update the cache version:
```javascript
const CACHE_NAME = 'jeeyacation-v3'; // Increment version
```

---

## 🎨 Image Requirements

### Ideal Specifications
- **Format**: JPG or PNG
- **Size**: 200x200px minimum (for retina displays)
- **Aspect Ratio**: Square (1:1)
- **File Size**: Under 100KB
- **Quality**: Clear facial recognition

### Image Preparation (Optional)
If you need to crop/resize images:

**Using Online Tools:**
- https://www.iloveimg.com/crop-image
- https://www.befunky.com/create/crop-photo/

**Using Command Line (ImageMagick):**
```bash
# Resize and crop to 200x200
convert input.jpg -resize 200x200^ -gravity center -extent 200x200 output.jpg
```

---

## ⚖️ Legal Best Practices

### Before Adding an Image, Consider:

1. **Source Type**:
   - ✅ Official university/company photos
   - ✅ Wikipedia/Wikimedia Commons
   - ✅ Government/public domain photos
   - ⚠️ News websites (fair use may apply)
   - ❌ Personal social media (seek permission)

2. **Document Everything**:
   - Always record the source URL
   - Note the date you retrieved it
   - Save a copy of any license terms

3. **Educational Purpose**:
   - Our use is clearly educational
   - Non-commercial project
   - Historical documentation
   - Limited use (small thumbnails)

4. **Be Prepared**:
   - Keep sources documented
   - Respond quickly to takedown requests
   - Have alternatives ready

---

## 🔍 Finding Good Profile Pictures

### Recommended Sources

**1. Wikipedia/Wikimedia Commons**
- https://commons.wikimedia.org
- Look for CC-licensed or public domain images
- Check "Use this file on the web" section

**2. Official Websites**
- University faculty pages
- Company executive pages
- Government websites

**3. News Archives**
- C-SPAN images (often public domain)
- Government hearing photos
- Official testimony images

### Search Tips
```
"[Person Name]" site:wikipedia.org
"[Person Name]" site:.gov
"[Person Name]" site:.edu
```

---

## 🧪 Testing

### After Adding Images:

1. **Clear Cache**: Hard refresh (Ctrl+Shift+R)
2. **Check Display**: Profile picture should appear in contact list
3. **Test Fallback**: Rename image temporarily to test initials fallback
4. **Mobile Test**: Check on mobile device or DevTools mobile view
5. **Offline Test**: Enable offline mode in DevTools

---

## 📊 Current Status

| Contact | Image | Attribution | Status |
|---------|-------|-------------|--------|
| Lisa New | ✅ | ✅ | Complete |
| Steve Bannon | ❌ | ⚠️ Template | Pending |
| Ken Starr | ❌ | ⚠️ Template | Pending |

---

## 🚀 Next Steps

1. Find and add Steve Bannon's profile picture
2. Find and add Ken Starr's profile picture
3. Update `ATTRIBUTIONS.md` with their sources
4. Test all images load correctly
5. Update service worker cache version if needed

---

**Last Updated**: November 19, 2025
