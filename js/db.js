// Database wrapper for SQL.js
let db = null;

const INITIAL_CONTACTS = [
    'Michael Wolff',
    'Weingarten, Reid',
    'Kathy Ruemmler',
    'Lawrence Summers',
    'Richard Kahn',
    'Landon Thomas Jr.',
    'Steve Bannon',
    'Darren Indyke',
    'Nicholas Ribis',
    'Lawrence Krauss',
    'Martin Weinberg',
    'Robert Kuhn',
    'Larry Visoski',
    'Lisa New',
    'Lesley Groff',
    'Boris Nikolic',
    'Deepak Chopra',
    'Joi Ito',
    'paul krassner',
    'Noam Chomsky',
    'Ken Starr',
    'Peggy Siegal',
    'Sultan Bin Sulayem',
    'Faith Kates',
    'Jonathan Farkas',
    'Robert Trivers',
    'Linda Stone',
    'Jessica Cadwell',
    'Pritzker, Tom',
    'Zubair Khan',
    'David Schoen',
    'Masha Drokova',
    'Jacquie Johnson',
    'Tyler Shears',
    'Ehud Barak',
    'Tonja Haddad Coleman',
    'Alireza Ittihadieh',
    'Etienne Binant',
    'David Stern',
    'Anas Alrasheed',
    'Thorbjon Jagland',
    'steven hoffenberg',
    'Jabor Y.',
    'David Grosof',
    'Steven Pfeiffer',
    'Nowak, Martin A.',
    'Ens, Amanda',
    'Christina Galbraith',
    'anasalrasheed',
    'Ariane de Rothschild',
    'Bruce Moskowitz',
    'Miller, Michael',
    'Barry J. Cohen',
    'Alan Dershowitz',
    'Nadia <nadja2102@yahoo.com>',
    'habebey',
    'Lang, Caroline',
    'Karp, Brad S',
    'Paul Barrett',
    'Jack Goldberger',
    'Eric Roth',
    'Jay Lefkowitz',
    'Mark L. Epstein',
    'Stanley Rosenberg',
    'Barbro Ehnbom',
    'Peter Thiel',
    'Melanie Spinella',
    'DAVID SCHOEN',
    'Dangene and Jennie Enterprise',
    'Al seckel',
    'Rebecca Watson',
    'Roy Black',
    'Jack LANG',
    'Jakob Kollhofer',
    'Richard Merkin',
    'soon yi previn',
    'Stephen Hanson',
    'tamem',
    'Jeremy Rubin',
    'Soon-Yi',
    'elisabeth feliho',
    'Erika Kellerhals',
    'Jide Zeitlin',
    'Michael, Charles',
    'Mohamed Waheed Hassan',
    'G Maxwell',
    'Ingram, David (Reuters News)',
    'Brandon Thompson',
    'Daniel Siad',
    'Heather Mann',
    'Larry',
    'Lilly Sanchez',
    'Vinit Sahni',
];

async function initDatabase() {
    try {
        // Initialize SQL.js
        const SQL = await initSqlJs({
            locateFile: file => `lib/${file}`
        });

        // Fetch and load the database
        const response = await fetch('./data/emails.db');
        const buffer = await response.arrayBuffer();
        db = new SQL.Database(new Uint8Array(buffer));

        console.log('Database loaded successfully');
        return true;
    } catch (error) {
        console.error('Failed to load database:', error);
        throw error;
    }
}

function getContacts() {
    if (!db) {
        throw new Error('Database not initialized');
    }

    const query = `
        SELECT 
            CASE 
                WHEN from_address = 'Jeffrey Epstein' THEN to_address 
                ELSE from_address 
            END as contact_name,
            COUNT(*) as message_count,
            MAX(timestamp_iso) as last_message_time,
            subject as last_subject
        FROM messages
        WHERE ((from_address IN (${INITIAL_CONTACTS.map(c => `'${c}'`).join(', ')}) 
                AND to_address = 'Jeffrey Epstein')
            OR (to_address IN (${INITIAL_CONTACTS.map(c => `'${c}'`).join(', ')}) 
                AND from_address = 'Jeffrey Epstein'))
            AND from_address != '<REDACTED>' 
            AND to_address != '<REDACTED>'
        GROUP BY contact_name
        ORDER BY last_message_time DESC
    `;

    const result = db.exec(query);
    
    if (result.length === 0) {
        return [];
    }

    const columns = result[0].columns;
    const values = result[0].values;

    return values.map(row => {
        const contact = {};
        columns.forEach((col, idx) => {
            contact[col] = row[idx];
        });
        return contact;
    });
}

function getMessagesForContact(contactName) {
    if (!db) {
        throw new Error('Database not initialized');
    }

    const query = `
        SELECT *, document_id FROM messages
        WHERE ((from_address = ? AND to_address = 'Jeffrey Epstein')
            OR (to_address = ? AND from_address = 'Jeffrey Epstein'))
            AND from_address != '<REDACTED>' 
            AND to_address != '<REDACTED>'
        ORDER BY timestamp_iso ASC
    `;

    const result = db.exec(query, [contactName, contactName]);
    
    if (result.length === 0) {
        return [];
    }

    const columns = result[0].columns;
    const values = result[0].values;

    return values.map(row => {
        const message = {};
        columns.forEach((col, idx) => {
            message[col] = row[idx];
        });
        return message;
    });
}

function getLastMessagePreview(contactName) {
    if (!db) {
        throw new Error('Database not initialized');
    }

    const query = `
        SELECT message_html, subject FROM messages
        WHERE ((from_address = ? AND to_address = 'Jeffrey Epstein')
            OR (to_address = ? AND from_address = 'Jeffrey Epstein'))
            AND from_address != '<REDACTED>' 
            AND to_address != '<REDACTED>'
        ORDER BY timestamp_iso DESC
        LIMIT 1
    `;

    const result = db.exec(query, [contactName, contactName]);
    
    if (result.length === 0 || result[0].values.length === 0) {
        return 'No messages';
    }

    const messageHtml = result[0].values[0][0];
    const subject = result[0].values[0][1];
    
    // Strip HTML tags and get first 50 characters
    const textContent = messageHtml.replace(/<[^>]*>/g, '').trim();
    const preview = textContent.substring(0, 50);
    
    return preview || subject || 'No preview available';
}

function searchMessages(query) {
    if (!db) {
        throw new Error('Database not initialized');
    }
    
    if (!query || query.trim().length === 0) {
        return [];
    }
    
    // Clean and prepare search terms
    const searchTerms = query.trim().toLowerCase().split(/\s+/);
    const searchPattern = searchTerms.map(term => `%${term}%`).join('%');
    
    // Search query that looks through message content, subject, and contact names
    const searchQuery = `
        SELECT 
            CASE 
                WHEN from_address = 'Jeffrey Epstein' THEN to_address 
                ELSE from_address 
            END as contact_name,
            message_html,
            subject,
            timestamp_iso,
            document_id,
            from_address,
            to_address
        FROM messages
        WHERE ((from_address IN (${INITIAL_CONTACTS.map(c => `'${c}'`).join(', ')}) 
                AND to_address = 'Jeffrey Epstein')
            OR (to_address IN (${INITIAL_CONTACTS.map(c => `'${c}'`).join(', ')}) 
                AND from_address = 'Jeffrey Epstein'))
            AND from_address != '<REDACTED>' 
            AND to_address != '<REDACTED>'
            AND (
                LOWER(message_html) LIKE ?
                OR LOWER(subject) LIKE ?
                OR LOWER(CASE 
                    WHEN from_address = 'Jeffrey Epstein' THEN to_address 
                    ELSE from_address 
                END) LIKE ?
            )
        ORDER BY timestamp_iso DESC
        LIMIT 100
    `;

    const result = db.exec(searchQuery, [searchPattern, searchPattern, searchPattern]);
    
    if (result.length === 0) {
        return [];
    }

    const columns = result[0].columns;
    const values = result[0].values;

    const messages = values.map(row => {
        const message = {};
        columns.forEach((col, idx) => {
            message[col] = row[idx];
        });
        return message;
    });
    
    // Group results by contact
    const groupedResults = {};
    
    messages.forEach(message => {
        const contactName = message.contact_name;
        
        if (!groupedResults[contactName]) {
            groupedResults[contactName] = {
                contact_name: contactName,
                messages: [],
                total_matches: 0
            };
        }
        
        // Add search match context
        message.search_context = generateSearchContext(message, searchTerms);
        groupedResults[contactName].messages.push(message);
        groupedResults[contactName].total_matches++;
    });
    
    // Convert to array and sort by most recent match
    return Object.values(groupedResults).sort((a, b) => {
        const aLatest = Math.max(...a.messages.map(m => m.timestamp_iso));
        const bLatest = Math.max(...b.messages.map(m => m.timestamp_iso));
        return bLatest - aLatest;
    });
}

function generateSearchContext(message, searchTerms) {
    // Strip HTML tags for context generation
    const textContent = message.message_html.replace(/<[^>]*>/g, '').trim();
    const subject = message.subject || '';
    
    // Find the best context snippet around search terms
    let bestContext = '';
    let contextStart = 0;
    
    for (const term of searchTerms) {
        const index = textContent.toLowerCase().indexOf(term.toLowerCase());
        if (index !== -1) {
            // Get context around the match (50 chars before, 100 chars after)
            const start = Math.max(0, index - 50);
            const end = Math.min(textContent.length, index + term.length + 100);
            let context = textContent.substring(start, end);
            
            // Add ellipsis if truncated
            if (start > 0) context = '...' + context;
            if (end < textContent.length) context = context + '...';
            
            if (context.length > bestContext.length) {
                bestContext = context;
            }
            break;
        }
    }
    
    // Fallback to subject or beginning of message
    if (!bestContext) {
        if (subject) {
            bestContext = subject;
        } else {
            bestContext = textContent.substring(0, 150);
            if (textContent.length > 150) bestContext += '...';
        }
    }
    
    return bestContext;
}

function highlightSearchTerms(text, searchTerms) {
    let highlightedText = text;
    
    searchTerms.forEach(term => {
        const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
    });
    
    return highlightedText;
}
