// Message/conversation view management
let currentContact = null;

// Search navigation state
let searchNavigationActive = false;
let searchOccurrences = [];
let currentSearchIndex = -1;
let conversationSearchQuery = '';

// Contact profiles cache for messages view
let messageContactProfiles = null;

// Load contact profiles for messages view
async function loadMessageContactProfiles() {
    if (messageContactProfiles) return messageContactProfiles;
    
    try {
        const response = await fetch('data/contact-profiles.json');
        const data = await response.json();
        messageContactProfiles = data.contacts;
        return messageContactProfiles;
    } catch (error) {
        console.error('Failed to load contact profiles for messages:', error);
        messageContactProfiles = {};
        return messageContactProfiles;
    }
}

// Get contact profile data for messages view
function getMessageContactProfile(contactName) {
    if (!messageContactProfiles) return {};
    
    const key = contactName.toLowerCase();
    return messageContactProfiles[key] || {};
}

// Create avatar HTML for conversation header
function createConversationAvatarHtml(contactName, initials, profile) {
    // Check if profile has an image defined
    if (profile && profile.image) {
        const imagePath = `data/profile_pics/${profile.image}`;
        return `
            <img src="${imagePath}" 
                 alt="${escapeHtml(profile.displayName || contactName)}"
                 class="avatar-image">
            <div class="avatar-initials" style="display: none;">${initials}</div>
        `;
    } else {
        // No image available, show initials
        return `
            <div class="avatar-initials">${initials}</div>
        `;
    }
}

// Make openConversation globally accessible
window.openConversation = async function(contactName) {
    currentContact = contactName;
    
    // Load contact profiles if not already loaded
    await loadMessageContactProfiles();
    
    // Get contact profile data
    const profile = getMessageContactProfile(contactName);
    
    // Update header with contact name (use display name if available)
    document.getElementById('conversationContactName').textContent = profile.displayName || contactName;
    
    // Update header with avatar
    const avatarContainer = document.getElementById('conversationAvatar');
    const initials = getInitials(profile.displayName || contactName);
    const avatarHtml = createConversationAvatarHtml(contactName, initials, profile);
    
    avatarContainer.innerHTML = avatarHtml;
    
    // Switch views
    document.getElementById('contactListView').classList.remove('active');
    document.getElementById('conversationView').classList.add('active');
    
    // Render messages
    renderMessages(contactName);
}

function getInitials(name) {
    if (!name) return '?';
    
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function closeConversation() {
    currentContact = null;
    
    // Clear search navigation when closing conversation
    clearSearchNavigation();
    
    // Switch views
    document.getElementById('conversationView').classList.remove('active');
    document.getElementById('contactListView').classList.add('active');
}

function renderMessages(contactName) {
    const messageContainer = document.getElementById('messageContainer');
    
    try {
        const messages = getMessagesForContact(contactName);
        
        if (messages.length === 0) {
            messageContainer.innerHTML = `
                <div class="empty-state">
                    <h3>No Messages</h3>
                    <p>No conversation history with ${escapeHtml(contactName)}.</p>
                </div>
            `;
            return;
        }

        messageContainer.innerHTML = '';
        
        let lastDate = null;
        let lastSubject = null;
        let targetMessageElement = null;
        
        // Check if we're coming from search results
        const searchQuery = sessionStorage.getItem('searchQuery');
        const searchTimestamp = sessionStorage.getItem('searchTimestamp');
        const searchTerms = searchQuery ? searchQuery.toLowerCase().split(/\s+/) : [];
        
        // Initialize search navigation if we have search terms
        if (searchTerms.length > 0) {
            initializeSearchNavigation(searchQuery, searchTerms);
        } else {
            clearSearchNavigation();
        }
        
        messages.forEach((message, index) => {
            // Add date separator if date changed
            const messageDate = getDateFromTimestamp(message.timestamp_iso);
            if (!lastDate || messageDate !== lastDate) {
                messageContainer.appendChild(createDateSeparator(message.timestamp_iso));
                lastDate = messageDate;
            }
            
            // Add subject separator if subject changed
            if (message.subject && message.subject !== lastSubject) {
                messageContainer.appendChild(createSubjectSeparator(message.subject));
                lastSubject = message.subject;
            }
            
            // Add message bubble
            const bubble = createMessageBubble(message, searchTerms);
            messageContainer.appendChild(bubble);
            
            // Mark target message if coming from search
            if (searchTimestamp && message.timestamp_iso === searchTimestamp) {
                bubble.classList.add('search-target');
                targetMessageElement = bubble;
            }
        });
        
        // Handle scrolling based on context
        if (targetMessageElement) {
            // Scroll to search target with delay to ensure DOM is ready
            setTimeout(() => {
                targetMessageElement.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
                
                // Remove highlight after a few seconds
                setTimeout(() => {
                    targetMessageElement.classList.remove('search-target');
                }, 3000);
            }, 100);
        } else {
            // Normal scroll to bottom
            messageContainer.scrollTop = messageContainer.scrollHeight;
        }
        
    } catch (error) {
        console.error('Error rendering messages:', error);
        messageContainer.innerHTML = `
            <div class="empty-state">
                <h3>Error</h3>
                <p>Failed to load messages. Please try again.</p>
            </div>
        `;
    }
}

function createDateSeparator(timestamp) {
    const separator = document.createElement('div');
    separator.className = 'date-separator';
    
    const dateText = formatDateSeparator(timestamp);
    separator.innerHTML = `<span>${dateText}</span>`;
    
    return separator;
}

function createSubjectSeparator(subject) {
    const separator = document.createElement('div');
    separator.className = 'subject-separator';
    
    const truncated = subject.length > 50 ? subject.substring(0, 50) + '...' : subject;
    separator.innerHTML = `<span>${escapeHtml(truncated)}</span>`;
    
    return separator;
}

function createMessageBubble(message, searchTerms = []) {
    const bubble = document.createElement('div');
    const isSent = message.from_address === 'Jeffrey Epstein';
    bubble.className = `message-bubble ${isSent ? 'sent' : 'received'}`;
    
    // Store document_id as data attribute
    if (message.document_id) {
        bubble.dataset.documentId = message.document_id;
    }
    
    // Sanitize and format message content
    let content = sanitizeMessageHtml(message.message_html);
    let hasSearchTerms = false;
    
    // Highlight search terms if provided
    if (searchTerms.length > 0) {
        const originalContent = content;
        content = highlightSearchTerms(content, searchTerms);
        hasSearchTerms = content !== originalContent && content.includes('<mark>');
    }
    
    const time = formatMessageTime(message.timestamp_iso);
    
    bubble.innerHTML = `
        <div class="bubble-content">${content}</div>
        <div class="bubble-time">${time}</div>
    `;
    
    // Add to search occurrences if this message contains search terms
    if (hasSearchTerms && searchNavigationActive) {
        searchOccurrences.push({
            element: bubble,
            timestamp: message.timestamp_iso
        });
    }
    
    // Add interaction handlers
    addMessageInteractionHandlers(bubble, message);
    
    return bubble;
}

function sanitizeMessageHtml(html) {
    if (!html) return 'No content';
    
    // Create a temporary div to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Remove script tags and event handlers
    const scripts = temp.querySelectorAll('script');
    scripts.forEach(script => script.remove());
    
    // Remove potentially dangerous attributes
    const allElements = temp.querySelectorAll('*');
    allElements.forEach(el => {
        // Remove event handler attributes
        Array.from(el.attributes).forEach(attr => {
            if (attr.name.startsWith('on')) {
                el.removeAttribute(attr.name);
            }
        });
    });
    
    // Get text content if HTML is too complex
    let content = temp.innerHTML.trim();
    
    // If content is very simple text, just return the text
    if (!content.includes('<')) {
        return escapeHtml(content);
    }
    
    // Basic HTML formatting - keep paragraphs, breaks, bold, italic
    content = content
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<p[^>]*>/gi, '')
        .replace(/<b[^>]*>/gi, '<strong>')
        .replace(/<\/b>/gi, '</strong>')
        .replace(/<i[^>]*>/gi, '<em>')
        .replace(/<\/i>/gi, '</em>');
    
    // Strip remaining HTML and format as text with line breaks
    const div = document.createElement('div');
    div.innerHTML = content;
    const text = div.textContent || div.innerText || '';
    
    // Convert newlines to <br> for display
    return text.split('\n').map(line => escapeHtml(line)).join('<br>');
}

function formatMessageTime(timestamp) {
    if (!timestamp) return '';
    
    // Parse timestamp (format: yyyymmddhhmmss)
    const year = parseInt(timestamp.substring(0, 4));
    const month = parseInt(timestamp.substring(4, 6)) - 1;
    const day = parseInt(timestamp.substring(6, 8));
    const hour = parseInt(timestamp.substring(8, 10));
    const minute = parseInt(timestamp.substring(10, 12));
    
    const date = new Date(year, month, day, hour, minute);
    
    // Format as time (e.g., "10:30 AM")
    return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit'
    });
}

function formatDateSeparator(timestamp) {
    if (!timestamp) return '';
    
    // Parse timestamp (format: yyyymmddhhmmss)
    const year = parseInt(timestamp.substring(0, 4));
    const month = parseInt(timestamp.substring(4, 6)) - 1;
    const day = parseInt(timestamp.substring(6, 8));
    
    const date = new Date(year, month, day);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const diffDays = Math.floor((today - messageDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return 'Today';
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    }
}

function getDateFromTimestamp(timestamp) {
    if (!timestamp) return null;
    return timestamp.substring(0, 8); // yyyymmdd
}

// Message interaction handlers
function addMessageInteractionHandlers(bubble, message) {
    let longPressTimer = null;
    let touchStartPos = { x: 0, y: 0 };
    let hasMoved = false;
    
    // Touch events for mobile (long-press)
    bubble.addEventListener('touchstart', (e) => {
        touchStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        hasMoved = false;
        
        longPressTimer = setTimeout(() => {
            if (!hasMoved) {
                e.preventDefault();
                showMessageActionSheet(bubble, message, e.touches[0]);
            }
        }, 500);
    });
    
    bubble.addEventListener('touchmove', (e) => {
        const moveThreshold = 10;
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        
        if (Math.abs(currentX - touchStartPos.x) > moveThreshold || 
            Math.abs(currentY - touchStartPos.y) > moveThreshold) {
            hasMoved = true;
            clearTimeout(longPressTimer);
        }
    });
    
    bubble.addEventListener('touchend', () => {
        clearTimeout(longPressTimer);
    });
    
    bubble.addEventListener('touchcancel', () => {
        clearTimeout(longPressTimer);
    });
    
    // Context menu for desktop (right-click)
    bubble.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showMessageActionSheet(bubble, message, e);
    });
}

function showMessageActionSheet(bubble, message, event) {
    // Remove any existing action sheet
    const existing = document.getElementById('messageActionSheet');
    if (existing) {
        existing.remove();
    }
    
    const documentId = bubble.dataset.documentId;
    if (!documentId) {
        console.warn('No document_id found for message');
        return;
    }
    
    // Create action sheet
    const actionSheet = document.createElement('div');
    actionSheet.id = 'messageActionSheet';
    actionSheet.className = 'action-sheet-overlay';
    
    // Determine if this is a touch event or mouse event
    const isTouchEvent = event.touches !== undefined;
    
    actionSheet.innerHTML = `
        <div class="action-sheet ${isTouchEvent ? 'mobile' : 'desktop'}">
            <div class="action-sheet-button" data-action="view-source">
                View Source
            </div>
            <div class="action-sheet-button" data-action="copy-text">
                Copy Text
            </div>
            <div class="action-sheet-button cancel" data-action="cancel">
                Cancel
            </div>
        </div>
    `;
    
    document.body.appendChild(actionSheet);
    
    // Position desktop version near cursor
    if (!isTouchEvent) {
        const sheet = actionSheet.querySelector('.action-sheet');
        const x = event.clientX;
        const y = event.clientY;
        
        sheet.style.position = 'fixed';
        sheet.style.left = `${x}px`;
        sheet.style.top = `${y}px`;
        sheet.style.transform = 'none';
    }
    
    // Trigger animation
    setTimeout(() => {
        actionSheet.classList.add('active');
    }, 10);
    
    // Handle button clicks
    actionSheet.addEventListener('click', async (e) => {
        const button = e.target.closest('.action-sheet-button');
        if (!button) {
            // Clicked on backdrop
            closeActionSheet(actionSheet);
            return;
        }
        
        const action = button.dataset.action;
        
        switch (action) {
            case 'view-source':
                const sourceUrl = `data/sources/${documentId}.jpg`;
                window.open(sourceUrl, '_blank');
                break;
                
            case 'copy-text':
                const bubbleContent = bubble.querySelector('.bubble-content');
                const textToCopy = bubbleContent.textContent || bubbleContent.innerText;
                
                try {
                    await navigator.clipboard.writeText(textToCopy);
                    // Optional: Show a brief confirmation
                    showCopyConfirmation(bubble);
                } catch (err) {
                    console.error('Failed to copy text:', err);
                }
                break;
                
            case 'cancel':
                // Just close
                break;
        }
        
        closeActionSheet(actionSheet);
    });
}

function closeActionSheet(actionSheet) {
    actionSheet.classList.remove('active');
    setTimeout(() => {
        actionSheet.remove();
    }, 300);
}

function showCopyConfirmation(bubble) {
    // Create a brief "Copied" notification
    const confirmation = document.createElement('div');
    confirmation.className = 'copy-confirmation';
    confirmation.textContent = 'Copied';
    
    bubble.appendChild(confirmation);
    
    setTimeout(() => {
        confirmation.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        confirmation.classList.remove('show');
        setTimeout(() => confirmation.remove(), 300);
    }, 1500);
}

// Search navigation functions
function initializeSearchNavigation(searchQuery, searchTerms) {
    searchNavigationActive = true;
    searchOccurrences = [];
    currentSearchIndex = -1;
    conversationSearchQuery = searchQuery;
    
    // Wait for DOM to be ready, then finalize search navigation
    setTimeout(() => {
        finalizeSearchNavigation();
    }, 100);
}

function finalizeSearchNavigation() {
    if (!searchNavigationActive || searchOccurrences.length === 0) {
        return;
    }
    
    // Find the initial search target if we have a timestamp
    const searchTimestamp = sessionStorage.getItem('searchTimestamp');
    if (searchTimestamp) {
        const targetIndex = searchOccurrences.findIndex(occ => occ.timestamp === searchTimestamp);
        if (targetIndex !== -1) {
            currentSearchIndex = targetIndex;
        } else {
            currentSearchIndex = 0;
        }
    } else {
        currentSearchIndex = 0;
    }
    
    // Add navigation controls to header
    addSearchNavigationControls();
    
    // Highlight current search result
    updateCurrentSearchHighlight();
}

function addSearchNavigationControls() {
    const conversationHeader = document.querySelector('#conversationView .conversation-header');
    if (!conversationHeader) return;
    
    // Remove existing search controls
    const existingControls = conversationHeader.querySelector('.search-navigation-controls');
    if (existingControls) {
        existingControls.remove();
    }
    
    // Create navigation controls
    const controls = document.createElement('div');
    controls.className = 'search-navigation-controls';
    controls.innerHTML = `
        <button id="searchNavUp" class="search-nav-button" title="Previous result">
            <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                <path d="M6 2L10 6H2L6 2Z" fill="currentColor"/>
            </svg>
        </button>
        <span class="search-nav-indicator">
            <span id="searchNavCurrent">${currentSearchIndex + 1}</span> of 
            <span id="searchNavTotal">${searchOccurrences.length}</span>
        </span>
        <button id="searchNavDown" class="search-nav-button" title="Next result">
            <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                <path d="M6 6L2 2H10L6 6Z" fill="currentColor"/>
            </svg>
        </button>
        <button id="searchNavClose" class="search-nav-close" title="Close search">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
        </button>
    `;
    
    // Insert controls after the contact name
    const contactName = conversationHeader.querySelector('#conversationContactName');
    if (contactName) {
        contactName.parentNode.insertBefore(controls, contactName.nextSibling);
    }
    
    // Add event listeners
    document.getElementById('searchNavUp').addEventListener('click', goToPreviousSearchResult);
    document.getElementById('searchNavDown').addEventListener('click', goToNextSearchResult);
    document.getElementById('searchNavClose').addEventListener('click', closeSearchNavigation);
}

function goToNextSearchResult() {
    if (searchOccurrences.length === 0) return;
    
    currentSearchIndex = (currentSearchIndex + 1) % searchOccurrences.length;
    navigateToCurrentResult();
}

function goToPreviousSearchResult() {
    if (searchOccurrences.length === 0) return;
    
    currentSearchIndex = currentSearchIndex - 1;
    if (currentSearchIndex < 0) {
        currentSearchIndex = searchOccurrences.length - 1;
    }
    navigateToCurrentResult();
}

function navigateToCurrentResult() {
    if (currentSearchIndex < 0 || currentSearchIndex >= searchOccurrences.length) return;
    
    const currentOccurrence = searchOccurrences[currentSearchIndex];
    
    // Update position indicator
    const currentSpan = document.getElementById('searchNavCurrent');
    if (currentSpan) {
        currentSpan.textContent = currentSearchIndex + 1;
    }
    
    // Update visual highlighting
    updateCurrentSearchHighlight();
    
    // Scroll to the current result
    currentOccurrence.element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
    });
}

function updateCurrentSearchHighlight() {
    // Remove previous current highlighting
    searchOccurrences.forEach(occ => {
        occ.element.classList.remove('search-current');
    });
    
    // Add current highlighting to the active result
    if (currentSearchIndex >= 0 && currentSearchIndex < searchOccurrences.length) {
        searchOccurrences[currentSearchIndex].element.classList.add('search-current');
    }
}

function closeSearchNavigation() {
    // Clear search session storage
    sessionStorage.removeItem('searchQuery');
    sessionStorage.removeItem('searchTimestamp');
    
    // Clear search navigation state
    clearSearchNavigation();
    
    // Re-render messages without search highlighting
    renderMessages(currentContact);
}

function clearSearchNavigation() {
    searchNavigationActive = false;
    searchOccurrences = [];
    currentSearchIndex = -1;
    conversationSearchQuery = '';
    
    // Remove navigation controls from header
    const existingControls = document.querySelector('.search-navigation-controls');
    if (existingControls) {
        existingControls.remove();
    }
    
    // Remove all search highlighting
    const searchHighlights = document.querySelectorAll('.search-current');
    searchHighlights.forEach(el => {
        el.classList.remove('search-current');
    });
}
