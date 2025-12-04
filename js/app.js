// Main application initialization
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Jeffrey Epstein\'s Phone - Initializing...');
    
    // Hide disclaimer modal initially
    const disclaimerModal = document.getElementById('disclaimerModal');
    disclaimerModal.classList.add('hidden');
    
    // Set up lock screen and disclaimer modal
    setupLockScreen();
    setupDisclaimerModal();
    
    try {
        // Initialize database
        await initDatabase();
        console.log('Database initialized');
        
        // Set up event listeners
        setupEventListeners();
        console.log('Event listeners set up');
        
        // Start on homescreen (contacts will be loaded when user navigates to them)
        console.log('Starting on homescreen');
        
        // Register service worker for offline capability
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .then((registration) => {
                    console.log('Service Worker registered:', registration);
                })
                .catch((error) => {
                    console.log('Service Worker registration failed:', error);
                });
        }
        
        console.log('Application ready!');
        
    } catch (error) {
        console.error('Failed to initialize application:', error);
        showErrorState(error.message);
    }
});

// Lock Screen Functions
function setupLockScreen() {
    const lockScreen = document.getElementById('lockScreen');
    
    // Show lock screen on load
    lockScreen.classList.remove('hidden');
    
    // When lock screen is clicked, show disclaimer modal and hide lock screen
    lockScreen.addEventListener('click', () => {
        console.log('Lock screen clicked - showing disclaimer');
        
        // Hide lock screen
        lockScreen.classList.add('hidden');
        
        // Show disclaimer modal
        const disclaimerModal = document.getElementById('disclaimerModal');
        disclaimerModal.classList.remove('hidden');
    });
}

// Disclaimer Modal Functions
function setupDisclaimerModal() {
    const modal = document.getElementById('disclaimerModal');
    const acceptButton = document.getElementById('disclaimerAccept');
    const cancelButton = document.getElementById('disclaimerCancel');
    const warning = document.getElementById('disclaimerWarning');
    
    // Handle "I Understand" button
    acceptButton.addEventListener('click', () => {
        hideDisclaimerModal();
    });
    
    // Handle "Cancel" button
    cancelButton.addEventListener('click', () => {
        // Show warning message
        warning.style.display = 'block';
        
        // Scroll to bottom to show warning
        const card = modal.querySelector('.disclaimer-card');
        setTimeout(() => {
            card.scrollTop = card.scrollHeight;
        }, 100);
    });
    
    // Prevent clicks on backdrop from closing modal
    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.classList.contains('disclaimer-backdrop')) {
            // Do nothing - modal stays open
        }
    });
    
    // Set up About modal
    setupAboutModal();
}

// About Modal Functions
function setupAboutModal() {
    const modal = document.getElementById('aboutModal');
    const okButton = document.getElementById('aboutModalOk');
    
    // Handle "OK" button
    okButton.addEventListener('click', () => {
        hideAboutModal();
    });
    
    // Allow clicks on backdrop to close modal
    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.classList.contains('disclaimer-backdrop')) {
            hideAboutModal();
        }
    });
}

function hideDisclaimerModal() {
    const modal = document.getElementById('disclaimerModal');
    modal.classList.add('hidden');
}

function showAboutModal() {
    const modal = document.getElementById('aboutModal');
    
    // Show the modal
    modal.classList.remove('hidden');
    
    // Scroll to top of content
    const card = modal.querySelector('.disclaimer-card');
    const content = card.querySelector('.disclaimer-content');
    content.scrollTop = 0;
}

function hideAboutModal() {
    const modal = document.getElementById('aboutModal');
    modal.classList.add('hidden');
}

function showLoadingState() {
    const contactList = document.getElementById('contactList');
    contactList.innerHTML = '<div class="loading">Loading database...</div>';
}

function showErrorState(message) {
    const contactList = document.getElementById('contactList');
    contactList.innerHTML = `
        <div class="empty-state">
            <h3>Error</h3>
            <p>${escapeHtml(message)}</p>
            <p style="margin-top: 16px;">Please refresh the page to try again.</p>
        </div>
    `;
}

function setupEventListeners() {
    // App icons on homescreen
    const appIcons = document.querySelectorAll('.app-icon');
    appIcons.forEach(icon => {
        icon.addEventListener('click', () => {
            const appName = icon.dataset.app;
            handleAppClick(appName);
        });
    });
    
    // Back button in contacts view
    const contactsBackButton = document.getElementById('contactsBackButton');
    contactsBackButton.addEventListener('click', () => {
        openHomescreen();
    });
    
    // Back button in photos view
    const photosBackButton = document.getElementById('photosBackButton');
    photosBackButton.addEventListener('click', () => {
        openHomescreen();
    });
    
    // Back button in documents view
    const documentsBackButton = document.getElementById('documentsBackButton');
    documentsBackButton.addEventListener('click', () => {
        openHomescreen();
    });
    
    // Back button in conversation view
    const backButton = document.getElementById('backButton');
    backButton.addEventListener('click', () => {
        closeConversation();
    });
    
    // Handle browser back button
    window.addEventListener('popstate', (event) => {
        if (currentContact) {
            closeConversation();
        }
    });
    
    // Push initial state
    if (window.history.state === null) {
        window.history.pushState({ view: 'homescreen' }, '');
    }
}

// Handle app icon clicks
function handleAppClick(appName) {
    console.log('App clicked:', appName);
    
    switch(appName) {
        case 'messages':
            openContactsFromHome();
            break;
        case 'photos':
            openPhotosFromHome();
            break;
        case 'documents':
            openDocumentsFromHome();
            break;
        case 'about':
            showAboutModal();
            break;
    }
}

// Navigate to homescreen
function openHomescreen() {
    console.log('Opening homescreen');
    
    const homescreenView = document.getElementById('homescreenView');
    const contactListView = document.getElementById('contactListView');
    const conversationView = document.getElementById('conversationView');
    const documentsView = document.getElementById('documentsView');
    const photosView = document.getElementById('photosView');
    
    homescreenView.classList.add('active');
    contactListView.classList.remove('active');
    conversationView.classList.remove('active');
    documentsView.classList.remove('active');
    photosView.classList.remove('active');
    
    window.history.pushState({ view: 'homescreen' }, '');
}

// Navigate from homescreen to contacts
function openContactsFromHome() {
    console.log('Opening contacts from homescreen');
    
    const homescreenView = document.getElementById('homescreenView');
    const contactListView = document.getElementById('contactListView');
    const conversationView = document.getElementById('conversationView');
    const documentsView = document.getElementById('documentsView');
    
    homescreenView.classList.remove('active');
    contactListView.classList.add('active');
    conversationView.classList.remove('active');
    documentsView.classList.remove('active');
    
    // Load contacts if not already loaded
    const contactList = document.getElementById('contactList');
    if (contactList.querySelector('.loading')) {
        showLoadingState();
        renderContactList().catch(error => {
            console.error('Error rendering contact list:', error);
            showErrorState(error.message);
        });
    }
    
    // Initialize search functionality
    initializeSearchBar();
    
    window.history.pushState({ view: 'contacts' }, '');
}

// Navigate from homescreen to photos
function openPhotosFromHome() {
    console.log('Opening photos from homescreen');
    
    const homescreenView = document.getElementById('homescreenView');
    const contactListView = document.getElementById('contactListView');
    const conversationView = document.getElementById('conversationView');
    const documentsView = document.getElementById('documentsView');
    const photosView = document.getElementById('photosView');
    
    homescreenView.classList.remove('active');
    contactListView.classList.remove('active');
    conversationView.classList.remove('active');
    documentsView.classList.remove('active');
    photosView.classList.add('active');
    
    window.history.pushState({ view: 'photos' }, '');
}

// Navigate from homescreen to documents
function openDocumentsFromHome() {
    console.log('Opening documents from homescreen');
    
    const homescreenView = document.getElementById('homescreenView');
    const contactListView = document.getElementById('contactListView');
    const conversationView = document.getElementById('conversationView');
    const documentsView = document.getElementById('documentsView');
    
    homescreenView.classList.remove('active');
    contactListView.classList.remove('active');
    conversationView.classList.remove('active');
    documentsView.classList.add('active');
    
    window.history.pushState({ view: 'documents' }, '');
}

// Utility function for escaping HTML (used across multiple files)
if (typeof escapeHtml === 'undefined') {
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
