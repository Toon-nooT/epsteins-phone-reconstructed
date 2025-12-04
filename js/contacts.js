// Search state management
let currentSearchQuery = '';
let searchResults = [];
let isSearchActive = false;

// Contact profiles cache
let contactProfiles = null;

// Load contact profiles on initialization
async function loadContactProfiles() {
    if (contactProfiles) return contactProfiles;
    
    try {
        const response = await fetch('data/contact-profiles.json');
        const data = await response.json();
        contactProfiles = data.contacts;
        return contactProfiles;
    } catch (error) {
        console.error('Failed to load contact profiles:', error);
        contactProfiles = {};
        return contactProfiles;
    }
}

// Get contact profile data
function getContactProfile(contactName) {
    if (!contactProfiles) return {};
    
    const key = contactName.toLowerCase();
    return contactProfiles[key] || {};
}

// Contact list management
async function renderContactList() {
    const contactListEl = document.getElementById('contactList');
    
    try {
        const contacts = getContacts();
        
        if (contacts.length === 0) {
            contactListEl.innerHTML = `
                <div class="empty-state">
                    <h3>No Contacts</h3>
                    <p>No messages found for the selected contacts.</p>
                </div>
            `;
            return;
        }

        contactListEl.innerHTML = '';
        
        // Create all contact items asynchronously
        const contactItems = await Promise.all(
            contacts.map(contact => createContactItem(contact))
        );
        
        // Append all items to the DOM
        contactItems.forEach(item => {
            contactListEl.appendChild(item);
        });
    } catch (error) {
        console.error('Error rendering contact list:', error);
        contactListEl.innerHTML = `
            <div class="empty-state">
                <h3>Error</h3>
                <p>Failed to load contacts. Please refresh the page.</p>
            </div>
        `;
    }
}

async function renderSearchResults(query) {
    const contactListEl = document.getElementById('contactList');
    
    try {
        const results = searchMessages(query);
        
        if (results.length === 0) {
            contactListEl.innerHTML = `
                <div class="empty-state">
                    <h3>No Results</h3>
                    <p>No messages found for "${escapeHtml(query)}"</p>
                    <button class="clear-search-btn" onclick="clearSearch()">Clear Search</button>
                </div>
            `;
            return;
        }

        contactListEl.innerHTML = '';
        
        // Add search results header
        const header = document.createElement('div');
        header.className = 'search-results-header';
        header.innerHTML = `
            <div class="search-results-count">${results.length} contact(s) found</div>
        `;
        contactListEl.appendChild(header);
        
        // Create all search result items asynchronously
        const searchItems = await Promise.all(
            results.map(result => createSearchResultItem(result, query))
        );
        
        // Append all items to the DOM
        searchItems.forEach(item => {
            contactListEl.appendChild(item);
        });
    } catch (error) {
        console.error('Error rendering search results:', error);
        contactListEl.innerHTML = `
            <div class="empty-state">
                <h3>Search Error</h3>
                <p>Failed to search messages. Please try again.</p>
                <button class="clear-search-btn" onclick="clearSearch()">Clear Search</button>
            </div>
        `;
    }
}

async function createContactItem(contact) {
    const item = document.createElement('div');
    item.className = 'contact-item';
    item.dataset.contactName = contact.contact_name;
    
    // Load contact profiles if not already loaded
    await loadContactProfiles();
    
    // Get contact profile data
    const profile = getContactProfile(contact.contact_name);
    
    // Get initials for avatar fallback
    const initials = getInitials(profile.displayName || contact.contact_name);
    
    // Get last message preview
    const preview = getLastMessagePreview(contact.contact_name);
    
    // Format timestamp
    const timestamp = formatContactTimestamp(contact.last_message_time);
    
    // Create avatar HTML with profile picture support
    const avatarHtml = createAvatarHtml(contact.contact_name, initials, profile);
    
    item.innerHTML = `
        ${avatarHtml}
        <div class="contact-info">
            <div class="contact-name">${escapeHtml(profile.displayName || contact.contact_name)}</div>
            <div class="contact-preview">${escapeHtml(preview)}</div>
        </div>
        <div class="contact-meta">
            <div class="contact-time">${timestamp}</div>
            <div class="contact-badge">${contact.message_count}</div>
        </div>
    `;
    
    // Add click handler
    item.addEventListener('click', () => {
        openConversation(contact.contact_name);
    });
    
    return item;
}

function createAvatarHtml(contactName, initials, profile) {
    // Check if profile has an image defined
    if (profile && profile.image) {
        const imagePath = `data/profile_pics/${profile.image}`;
        return `
            <div class="contact-avatar">
                <img src="${imagePath}" 
                     alt="${escapeHtml(profile.displayName || contactName)}"
                     class="avatar-image">
                <div class="avatar-initials" style="display: none;">${initials}</div>
            </div>
        `;
    } else {
        // No image available, show initials
        return `
            <div class="contact-avatar">
                <div class="avatar-initials">${initials}</div>
            </div>
        `;
    }
}

function getInitials(name) {
    if (!name) return '?';
    
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

function formatContactTimestamp(timestamp) {
    if (!timestamp) return '';
    
    // Parse timestamp (format: yyyymmddhhmmss)
    const year = parseInt(timestamp.substring(0, 4));
    const month = parseInt(timestamp.substring(4, 6)) - 1;
    const day = parseInt(timestamp.substring(6, 8));
    const hour = parseInt(timestamp.substring(8, 10));
    const minute = parseInt(timestamp.substring(10, 12));
    
    const date = new Date(year, month, day, hour, minute);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const diffDays = Math.floor((today - messageDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        // Today - show time
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
}

async function createSearchResultItem(result, query) {
    const item = document.createElement('div');
    item.className = 'search-result-item';
    item.dataset.contactName = result.contact_name;
    
    // Load contact profiles if not already loaded
    await loadContactProfiles();
    
    // Get contact profile data
    const profile = getContactProfile(result.contact_name);
    
    // Get initials for avatar fallback
    const initials = getInitials(profile.displayName || result.contact_name);
    
    // Create avatar HTML
    const avatarHtml = createAvatarHtml(result.contact_name, initials, profile);
    
    // Get search terms for highlighting
    const searchTerms = query.trim().toLowerCase().split(/\s+/);
    
    // Show the most relevant message with context
    const topMessage = result.messages[0];
    const context = highlightSearchTerms(topMessage.search_context, searchTerms);
    const timestamp = formatContactTimestamp(topMessage.timestamp_iso);
    
    // Show match count if multiple messages
    const matchInfo = result.total_matches > 1 ? 
        `${result.total_matches} messages` : 
        '1 message';
    
    item.innerHTML = `
        ${avatarHtml}
        <div class="contact-info">
            <div class="contact-name">${highlightSearchTerms(escapeHtml(profile.displayName || result.contact_name), searchTerms)}</div>
            <div class="search-context">${context}</div>
        </div>
        <div class="contact-meta">
            <div class="contact-time">${timestamp}</div>
            <div class="search-match-count">${matchInfo}</div>
        </div>
    `;
    
    // Add click handler to open conversation
    item.addEventListener('click', () => {
        // Store search context for highlighting in conversation
        sessionStorage.setItem('searchQuery', query);
        sessionStorage.setItem('searchTimestamp', topMessage.timestamp_iso);
        openConversation(result.contact_name);
    });
    
    return item;
}

function performSearch(query) {
    if (!query || query.trim().length === 0) {
        clearSearch();
        return;
    }
    
    currentSearchQuery = query.trim();
    isSearchActive = true;
    
    // Update UI to show search is active
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.classList.add('searching');
    }
    
    // Render search results
    renderSearchResults(currentSearchQuery);
    
    // Update header title to show search mode
    const headerTitle = document.querySelector('#contactListView h1');
    if (headerTitle) {
        headerTitle.textContent = `Search Results`;
    }
}

function clearSearch() {
    currentSearchQuery = '';
    isSearchActive = false;
    searchResults = [];
    
    // Clear search input
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.value = '';
        searchInput.classList.remove('searching');
    }
    
    // Restore normal contact list
    renderContactList().catch(error => {
        console.error('Error rendering contact list:', error);
        showErrorState(error.message);
    });
    
    // Restore header title
    const headerTitle = document.querySelector('#contactListView h1');
    if (headerTitle) {
        headerTitle.textContent = '📧 My Messages';
    }
    
    // Clear search context
    sessionStorage.removeItem('searchQuery');
    sessionStorage.removeItem('searchTimestamp');
}

function initializeSearchBar() {
    const searchInput = document.querySelector('.search-bar input');
    if (!searchInput) return;
    
    // Enable the search input
    searchInput.disabled = false;
    searchInput.placeholder = 'Search messages...';
    
    // Add search icon click handler
    const searchIcon = document.querySelector('.search-icon');
    if (searchIcon) {
        searchIcon.addEventListener('click', () => {
            searchInput.focus();
        });
    }
    
    // Debounce search to avoid too many queries
    let searchTimeout = null;
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        
        // Clear previous timeout
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        
        // Set new timeout for search
        searchTimeout = setTimeout(() => {
            performSearch(query);
        }, 300); // 300ms debounce
    });
    
    // Handle escape key to clear search
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            clearSearch();
            searchInput.blur();
        }
    });
    
    // Handle enter key
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const query = e.target.value.trim();
            if (query) {
                performSearch(query);
            }
        }
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
