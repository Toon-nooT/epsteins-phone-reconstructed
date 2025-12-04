# Epstein's Phone (Reconstructed)

A **live Progressive Web App (PWA)** for browsing emails from the Jeffrey Epstein estate documents released by the U.S. House Committee on Oversight and Government Reform. This project transforms thousands of email screenshot images into a structured, searchable database with an authentic iPhone Messages-style interface.

**🚀 [Live Demo](https://epsteinsphone.org/)** | **📱 Fully Mobile Optimized** | **⚡ Works Offline**

---

## 📊 Project Status

### ✅ Fully Implemented

#### Data Processing Pipeline
- **Vision LLM-based extraction** from email screenshots using Qwen 2.5 VL 72B with structured output
- **SQLite database** with 3,997 individual messages (optimized and cleaned)
- **Message extraction**: From/To addresses, timestamps, subjects, and HTML content
- **Data cleaning**: Name standardization, duplicate detection, and LLM-based redaction resolution
- **Parallel processing**: 20-thread implementation for efficient processing

#### Progressive Web App (PWA)
- **iPhone device frame**: Realistic iOS device simulation with status bar
- **Homescreen navigation**: iOS-style app grid with Messages, Photos, Documents
- **iOS Messages interface**: Contact list and conversation views
- **Photos view**: Placeholder view with "not yet implemented" message
- **Documents view**: Access to official House Oversight Committee releases
- **Profile pictures**: Contact avatars with proper attribution system
- **Service worker**: Full offline capability after first load
- **Installable**: Add to home screen on mobile devices
- **Mobile-first design**: Optimized for vertical phone displays (~375px width)

#### Features
- **Full-text search**: Search across all messages, subjects, and contact names with highlighting
- **Context menu**: Long-press (mobile) or right-click (desktop) on messages to:
  - View original source document (high-resolution JPG)
  - Copy message text to clipboard
- **Conversation threading**: Messages organized by contact chronologically
- **Date separators**: Clear visual breaks (Today, Yesterday, specific dates)
- **Subject separators**: Email threads visually distinguished within conversations
- **Chat bubble layout**: Jeffrey's messages (blue, right) vs. contacts (gray, left)
- **Profile pictures**: Public domain images for key contacts
- **Responsive design**: Works on desktop, tablet, and mobile

#### Documentation & Deployment
- **GitHub Pages ready**: Fully static site, no backend required

### 🚧 In Progress
- Fine-tuning conversation threading logic
- Adding remaining profile pictures for contacts
- Database optimization and performance improvements

### 📋 Future Enhancements
- **Data Processing Pipeline**: Improve on all fronts. Filtering, cleanup, other models, ensembling models, ...

---

## 🎯 Project Overview

This project takes a chaotic dump of email screenshot images (23,124 JPG files from the Epstein estate document release) and converts them into:

- **Structured message database** with proper sender/recipient information
- **Chronological timelines** showing conversation flow
- **Searchable content** across all messages (planned)
- **Contact-based organization** similar to iPhone Messages app
- **Thread reconstruction** linking related messages
- **Progressive Web App** that works offline and can be installed like a native app

### Key Achievement
A **fully functional, client-side email browser** that requires no backend server, runs entirely in the browser using WebAssembly, and provides an authentic iPhone Messages experience.

---

## 📁 Dataset Information

### Source

#### November 12, 2025 Release
- **Official Release**: [U.S. House Oversight Committee - November 12, 2025](https://oversight.house.gov/release/oversight-committee-releases-additional-epstein-estate-documents/)
- **Total Images**: 23,124 JPG files (consecutively numbered 010477-033600)
- **Documents**: ~2,897 complete documents
- **Email Documents**: Subset identified by TEXT files starting with "From:"

#### September 8, 2025 Release
- **Official Release**: [U.S. House Oversight Committee - September 8, 2025](https://oversight.house.gov/release/oversight-committee-releases-records-provided-by-the-epstein-estate-chairman-comer-provides-statement/)
- **Documents Provided by Epstein Estate**: 4 PDF documents available in the Documents app
  - **Request No. 1**: "The First Fifty Years, My Birthday Book" - [View PDF](https://d3i6fh83elv35t.cloudfront.net/static/2025/09/Request-No.-1.pdf)
  - **Request No. 2**: "Last Will and Testament" - [View PDF](https://drive.google.com/file/d/1kjRqGkhpBweA35xiMIdZfv0vo54kQ3uq/view?usp=sharing)
  - **Request No. 4**: "Investigation" - [View PDF](https://drive.google.com/file/d/1kWhiZSNvJM0t8vO6Rx3fLlboZ5ejjhCe/view?usp=sharing)
  - **Request No. 8**: "Exhibit 10 Part 2" - [View PDF](https://drive.google.com/file/d/1Q9bv7RXtlktsiHyfQa-gOvXkIl2Td8B6/view?usp=sharing)
- **Google Drive Folder**: [All Documents](https://drive.google.com/drive/folders/1ZSVpXEhI7gKI0zatJdYe6QhKJ5pjUo4b)

### Dataset Structure
```
DATASET_ROOT/
├── IMAGES/          # 23,124 JPG files (individual pages)
├── TEXT/            # 2,897 OCR'd text files (complete documents)
└── DATA/            # Metadata CSV (document grouping info)
```

### Key Characteristics
- TEXT files are already combined complete documents (not individual pages)
- Each TEXT file number corresponds to matching IMAGE file number
- Metadata CSV shows which pages belong to the same document
- Emails identified by TEXT files starting with "From:"

---

## 🏗️ Technical Architecture

### Data Processing Pipeline

1. **Email Identification**
   - Filter TEXT files starting with "From:"
   - Apply page limit filter (≤5 pages for initial processing)

2. **Image Processing**
   - Locate corresponding JPG images for each document
   - Resize images to 800px height for efficient processing
   - Base64 encode for API submission

3. **Vision LLM Extraction** (OpenAI GPT-4o/Custom endpoint)
   - Submit images + OCR text to vision model
   - Extract structured data:
     - Subject line
     - From/To addresses
     - Other recipients (CC/BCC)
     - Timestamps (raw + ISO format)
     - Message HTML content
     - Document ID (from image filename)

4. **Data Cleaning**
   - Name standardization (e.g., "Larry Summers" → "Lawrence Summers")
   - Jeffrey Epstein name variant consolidation
   - Timestamp normalization
   - Duplicate detection

5. **Database Storage**
   - Thread-safe parallel writes (20 workers)
   - Indexed for efficient querying

### Database Schema (Optimized)

#### `messages` table
```sql
- id (PRIMARY KEY)
- from_address (TEXT)
- to_address (TEXT)
- timestamp_iso (TEXT)
- subject (TEXT)
- message_html (TEXT)
- document_id (TEXT) -- HOUSE_OVERSIGHT_XXXXXX for source linking

Indexes:
- idx_messages_timestamp (timestamp_iso)
- idx_messages_from (from_address)
- idx_messages_to (to_address)
```

**Schema Notes:**
- Optimized structure removes unused columns for better performance
- All message data accessible via single table for efficient queries
- Document IDs link to source JPG files in `data/sources/` directory

### Current Statistics
- **Processed Documents**: Filtered for emails ≤5 pages
- **Extracted Messages**: 3,997 individual messages (after cleanup and optimization)
- **Key Contacts**: 85+ contacts including Jeffrey Epstein, Lawrence Summers, Robert Kuhn, Martin Weinberg, Ken Starr, Ehud Barak, Boris Nikolic, Lisa New, Steve Bannon, Michael Wolff, Kathy Ruemmler, and many others

---

## 🛠️ Technology Stack

### Backend / Data Processing
- **Python 3.x**: Core processing language
- **OpenAI API**: Vision model for email extraction
- **SQLite**: Local database storage
- **Pandas**: Data processing and manipulation
- **PIL/Pillow**: Image processing and resizing
- **ThreadPoolExecutor**: Parallel processing (20 workers)

### Frontend / PWA
- **Vanilla JavaScript**: No framework dependencies for maximum performance
- **SQL.js (WebAssembly)**: Client-side SQLite database engine
- **Service Worker**: Offline support and caching
- **CSS3**: iOS Messages-style UI with custom styling
- **Progressive Web App**: Manifest for installability

### Key Features
- **Fully static**: No backend server required
- **Client-side database**: 5MB SQLite database runs in browser via WebAssembly
- **Offline-first**: Works completely offline after first load
- **Installable**: Add to home screen on iOS/Android
- **No build process**: Pure HTML/CSS/JS, ready to deploy

---

## 🎨 Implemented UI Features

### iPhone Device Simulation
Realistic iPhone frame with:
- **Status bar**: Live clock, signal strength, battery indicator
- **Notch design**: Authentic iPhone X-style notch
- **Device dimensions**: 375px width viewport simulation

### Homescreen View
iOS-style app grid featuring:
- **Messages app**: Opens email browser
- **Photos app**: Placeholder for future photo browsing
- **Documents app**: Browse official document releases (September 8, 2025 release available)
- **App icons**: Emoji-based icons with labels

### Documents View
iOS-style document list featuring:
- **September 8, 2025 Release**: 4 PDF documents from House Oversight Committee
- **Document cards**: Clean, tappable cards with icons and descriptions
- **External links**: Documents open in new tab for viewing
- **Source attribution**: Link to official House Oversight Committee release

### Contact List Screen
```
┌─────────────────────┐
│ ← 📧 My Messages 👤 │ ← Header with back button and owner avatar
├─────────────────────┤
│ 🔍 Search...        │ ← Search bar (planned)
├─────────────────────┤
│                     │
│ 👤 Lisa New         │
│    Last message...  │
│    Nov 15, 2005     │
│    [24 messages]    │
├─────────────────────┤
│ 👤 Steve Bannon     │
│    Meeting details..│
│    Nov 12, 2005     │
│    [8 messages]     │
├─────────────────────┤
│ 👤 Ken Starr        │
│    Re: Call...      │
│    Oct 20, 2005     │
│    [12 messages]    │
└─────────────────────┘
```

**Features:**
- Scrollable contact list
- Profile pictures for contacts
- Last message preview
- Timestamp of last message
- Total message count badge
- Jeffrey Epstein's profile picture in header

### Conversation Screen
```
┌─────────────────────┐
│ ← 👤 Lisa New       │ ← Back button + avatar + name
├─────────────────────┤
│                     │
│ Nov 15, 2005        │ ← Date separator
│                     │
│ Re: Business deal   │ ← Subject separator
│                     │
│ ┌─────────────────┐ │
│ │ Hey Jeffrey,    │ │ Lisa (gray, left)
│ │ can we meet?    │ │
│ │ 10:30 AM        │ │
│ └─────────────────┘ │
│                     │
│     ┌─────────────┐ │
│     │ Sure, when? │ │ Jeffrey (blue, right)
│     │ 10:35 AM    │ │
│     └─────────────┘ │
│                     │
│ Re: Another topic   │ ← New subject = separator
│                     │
│ ┌─────────────────┐ │
│ │ About that...   │ │ Lisa (gray, left)
│ │ 2:15 PM         │ │
│ └─────────────────┘ │
└─────────────────────┘
```

**Features:**
- Chronological message flow
- Date separators (Today, Yesterday, dates)
- Subject line separators between email threads
- Chat bubbles: Jeffrey (blue, right) vs. contacts (gray, left)
- Timestamps below each message
- Contact avatar in header
- Context menu on long-press/right-click:
  - View original source document
  - Copy message text

---

### Local Testing
```bash
# Python 3
python -m http.server 8000

# Then open: http://localhost:8000
```

### Progressive Web App
- **Installable**: Users can add to home screen
- **Offline**: Works 100% offline after first load
- **Updates**: Service worker caching with version control

---

## 📂 Project Files

### Frontend Application
- `index.html` - Main application entry point with iPhone device frame
- `manifest.json` - PWA manifest for installable app
- `sw.js` - Service worker for offline support
- `css/style.css` - iOS Messages-style styling
- `js/app.js` - Application initialization and homescreen logic
- `js/db.js` - SQLite database wrapper (SQL.js)
- `js/contacts.js` - Contact list management and rendering
- `js/messages.js` - Conversation view and message rendering
- `lib/` - SQL.js WebAssembly files
- `data/emails.db` - Client-side database copy (~5MB)
- `data/profile_pics/` - Contact profile pictures with attributions

### Backend/Data Processing
- `data_processing.ipynb` - Main data processing pipeline
- `emails.db` - SQLite database with extracted messages (source)
- `emails_list.csv` - List of email documents to process
- `.env` - Configuration (API keys, paths)

---

## 📝 Data Processing Notes

### Name Standardization Applied
- **Jeffrey Epstein** variants: "jeffrey e", "jeevacation", "jeeyacation", "J" (in thread context)
- **Lawrence Summers**: "Larry Summers", "Lawrence H. Summers"
- **Robert Kuhn**: "Robert Lawrence Kuhn", "Robert L. Kuhn"
- **Martin Weinberg**: "Martin G. Weinberg"
- **Ken Starr**: "Starr, Ken", "Starr"
- **Ehud Barak**: "ehud barak", "ehbarak"
- And others...

### Known Data Issues
- **Redacted Data**: ~2,517 messages contain `<REDACTED>` for from/to fields
- **Duplicates**: ~2,465 duplicate messages identified (90%+ similarity within 5 minutes)
- **Missing Timestamps**: ~10 messages lack timestamps (inherited from thread start time -30s)
- **Thread Reconstruction**: Some messages appear in multiple threads (reply forks)

---

## 🎯 Current Limitations

### Technical Constraints  
- **Client-side only**: Database loads in browser (acceptable for modern devices)
- **No pagination**: All messages for a contact load at once (works well for current dataset)
- **Profile pictures**: Manual addition required (see `PROFILE_PICTURES.md`)
- **Processing scope**: Currently limited to emails ≤5 pages for processing efficiency

### Data Quality Notes
- Some redacted addresses remain unresolved despite LLM-based resolution attempts
- Occasional duplicate messages from complex email thread structures
- Timestamp inconsistencies in heavily threaded conversations or because of different timezones

---

## 🔧 Configuration

### Changing Displayed Contacts
Edit `js/db.js`:
```javascript
const INITIAL_CONTACTS = ['Lisa New', 'Steve Bannon', 'Ken Starr'];
```
Replace with any contact names from the database.

### Updating Service Worker Cache
When making changes, update cache version in `sw.js`:
```javascript
const CACHE_NAME = 'jeevacation-v2';  // Increment version
```

---

## 📊 Performance

- **Initial Load**: ~1-2 seconds (includes 3MB database download)
- **Subsequent Loads**: <100ms (fully cached)
- **Offline**: 100% functional after first load
- **Mobile**: Optimized for iPhone and Android devices
- **Database**: SQL.js WebAssembly for efficient querying

---

## 🤝 Contributing

This is a personal research project working with public domain government documents. The codebase is open for review and educational purposes.

---

## ⚖️ Legal Note

**Data Source**: All data processed by this project comes from official U.S. House Committee on Oversight and Government Reform releases and is in the public domain.

**Purpose**: This project is for research, educational, and informational purposes only.

**No Affiliation**: This is an independent project and is not affiliated with, endorsed by, or officially connected to the U.S. House of Representatives, the Committee on Oversight and Government Reform, or any government entity.

**Data Processing Disclaimer**: All data has been processed using Large Language Models (LLMs) for extraction and structuring. Despite utmost care in data processing, errors, inaccuracies, or misinterpretations may occur.

**No Warranties**: This project is provided "AS-IS" without any warranties or guarantees of accuracy, completeness, or reliability. Users are strongly encouraged to verify all information by consulting the original source documents.

**User Responsibility**: Users should independently verify any information before relying on it. Links to original source documents are provided where available via the context menu feature.

**Limitation of Liability**: The creator(s) of this project assume no liability for any errors, omissions, or consequences arising from the use of this information.

**Image Attribution**: All images are either public domain or used under fair use for educational purposes.

---

**Last Updated**: November 25, 2025
