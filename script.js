// Function to track user history
function trackHistory(resourceName, resume = false) {
    // Get existing history or initialize empty array
    let history = JSON.parse(localStorage.getItem('scienceHubHistory')) || [];
    
    // Create history item object
    const historyItem = {
        name: resourceName,
        timestamp: new Date().toISOString(),
        type: resume ? 'resume' : 'visit'
    };
    
    // Remove duplicates first to keep it clean
    history = history.filter(item => item.name !== resourceName);
    history.unshift(historyItem);
    
    // Keep only the last 10 items to prevent overflow
    if (history.length > 10) {
        history.pop();
    }
    
    // Save back to local storage
    localStorage.setItem('scienceHubHistory', JSON.stringify(history));
    
    // Update the display if we're on the materials page
    if (document.getElementById('history-container')) {
        loadHistory();
    }
}

// Function to get recent history for display
function getRecentHistory() {
    const history = JSON.parse(localStorage.getItem('scienceHubHistory')) || [];
    return history.slice(0, 5); // Return only last 5 items
}

// Function to load history on the materials page
function loadHistory() {
    const historyContainer = document.getElementById('history-container');
    
    // Only run this if the container exists on the current page
    if (!historyContainer) return;

    const history = getRecentHistory();

    if (history.length === 0) {
        historyContainer.innerHTML = '<p class="text-muted">No recent activity yet. Click "Get Started" to begin!</p>';
        return;
    }

    // Clear current content
    historyContainer.innerHTML = '';
    
    // Create tags for each history item
    history.forEach(item => {
        const tag = document.createElement('span');
        tag.className = 'history-tag';
        
        // Add icon based on type
        const icon = item.type === 'resume' ? 'gg-play-button-o' : 'gg-check-o';
        tag.innerHTML = `<i class="${icon}" style="margin-right: 5px; font-size: 0.9rem;"></i>`;
        
        // Add text (show "Resume" for resume type)
        const displayText = item.type === 'resume' ? `Resume: ${item.name}` : item.name;
        tag.innerHTML += displayText;
        
        historyContainer.appendChild(tag);
    });
}

// Function to initialize Get Started button
function initGetStartedButton() {
    const getStartedBtn = document.querySelector('#getStartedBtn');
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', function(e) {
            e.preventDefault();
            trackHistory('Main Menu', true);
            window.location.href = 'materials.html';
        });
    }
}

// Function to initialize card links
function initCardLinks() {
    const cardLinks = document.querySelectorAll('.card-link');
    cardLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const cardElement = this.querySelector('.material-card');
            if (cardElement) {
                const cardTitleElement = cardElement.querySelector('.card-title');
                if (cardTitleElement) {
                    const cardTitle = cardTitleElement.textContent;
                    trackHistory(cardTitle);
                }
            }
        });
    });
}

// Run all initialization when the page finishes loading
document.addEventListener('DOMContentLoaded', function() {
    loadHistory();
    initGetStartedButton();
    initCardLinks();
});

// Function to clear history (optional, can be used for debugging)
function clearHistory() {
    localStorage.removeItem('scienceHubHistory');
    loadHistory(); // Reload if on materials page
    
    // Also clear progress on materials page
    if (document.getElementById('progressBar')) {
        document.getElementById('progressBar').style.width = '0%';
        document.getElementById('progressPercentage').textContent = '0%';
        document.getElementById('visitedCount').textContent = '0';
        document.getElementById('resumeCount').textContent = '0';
        document.getElementById('daysActive').textContent = '0';
        document.getElementById('historyCount').textContent = '0 items';
    }
}

// Make clearHistory available globally
window.clearHistory = clearHistory;