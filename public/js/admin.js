// Admin Dashboard JavaScript

let waitlistData = [];
let selectedUsers = new Set();

// Check authentication on page load
window.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    await loadWaitlistData();
    updateStats();
    setupEventListeners();
});

// Check if user is authenticated
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/check');
        const data = await response.json();
        
        if (!data.authenticated) {
            // Not authenticated, redirect to home
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Auth check error:', error);
        window.location.href = '/';
    }
}

// Load waitlist data
async function loadWaitlistData() {
    try {
        const response = await fetch('/api/waitlist');
        if (response.ok) {
            waitlistData = await response.json();
            renderTable();
        } else if (response.status === 401) {
            // Unauthorized, redirect to login
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Error loading waitlist:', error);
    }
}

// Render the waitlist table
function renderTable() {
    const tbody = document.getElementById('waitlistBody');
    const emptyState = document.getElementById('emptyState');
    
    if (waitlistData.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    // Sort by date (newest first)
    const sortedData = [...waitlistData].sort((a, b) => 
        new Date(b.joined_date) - new Date(a.joined_date)
    );
    
    tbody.innerHTML = sortedData.map(entry => `
        <tr data-id="${entry.id}">
            <td>
                <input type="checkbox" class="user-checkbox" data-id="${entry.id}" data-email="${entry.email}">
                ${entry.name}
            </td>
            <td>${entry.email}</td>
            <td>${entry.hrv_tool || 'Not specified'}</td>
            <td>${formatDate(entry.joined_date)}</td>
            <td>
                <span class="status-badge ${entry.notified ? 'status-notified' : 'status-pending'}">
                    ${entry.notified ? 'Notified' : 'Pending'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    ${!entry.notified ? 
                        `<button class="btn-small btn-notify" onclick="markAsNotified('${entry.id}')">
                            Mark Notified
                        </button>` : ''
                    }
                    <button class="btn-small btn-delete" onclick="deleteEntry('${entry.id}')">
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    // Add checkbox event listeners
    document.querySelectorAll('.user-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const id = e.target.dataset.id;
            const email = e.target.dataset.email;
            
            if (e.target.checked) {
                selectedUsers.add({ id, email });
            } else {
                selectedUsers = new Set([...selectedUsers].filter(u => u.id !== id));
            }
        });
    });
}

// Update statistics
function updateStats() {
    const total = waitlistData.length;
    const notified = waitlistData.filter(e => e.notified).length;
    const pending = total - notified;
    
    // Calculate today's signups
    const today = new Date().toDateString();
    const todaySignups = waitlistData.filter(e => 
        new Date(e.joined_date).toDateString() === today
    ).length;
    
    document.getElementById('totalCount').textContent = total;
    document.getElementById('todayCount').textContent = todaySignups;
    document.getElementById('notifiedCount').textContent = notified;
    document.getElementById('pendingCount').textContent = pending;
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Mark entry as notified
async function markAsNotified(id) {
    try {
        const response = await fetch(`/api/waitlist/${id}/notify`, {
            method: 'PUT'
        });
        
        if (response.ok) {
            await loadWaitlistData();
            updateStats();
        }
    } catch (error) {
        console.error('Error marking as notified:', error);
        alert('Failed to update entry');
    }
}

// Delete entry
async function deleteEntry(id) {
    if (!confirm('Are you sure you want to delete this entry?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/waitlist/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            await loadWaitlistData();
            updateStats();
        }
    } catch (error) {
        console.error('Error deleting entry:', error);
        alert('Failed to delete entry');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        try {
            await fetch('/api/logout', { method: 'POST' });
            window.location.href = '/';
        } catch (error) {
            console.error('Logout error:', error);
        }
    });
    
    // Export CSV button
    document.getElementById('exportBtn').addEventListener('click', () => {
        window.location.href = '/api/waitlist/export';
    });
    
    // Search functionality
    document.getElementById('searchInput').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        
        if (searchTerm === '') {
            renderTable();
            return;
        }
        
        const filtered = waitlistData.filter(entry => 
            entry.name.toLowerCase().includes(searchTerm) ||
            entry.email.toLowerCase().includes(searchTerm)
        );
        
        // Temporarily update the data and re-render
        const originalData = waitlistData;
        waitlistData = filtered;
        renderTable();
        waitlistData = originalData;
    });
    
    // Send to selected users
    document.getElementById('sendToSelected').addEventListener('click', () => {
        if (selectedUsers.size === 0) {
            alert('Please select at least one user');
            return;
        }
        
        const appLink = document.getElementById('appLink').value;
        if (!appLink) {
            alert('Please enter the app download link');
            return;
        }
        
        showEmailModal([...selectedUsers], appLink);
    });
    
    // Send to all pending users
    document.getElementById('sendToAll').addEventListener('click', () => {
        const pendingUsers = waitlistData
            .filter(e => !e.notified)
            .map(e => ({ id: e.id, email: e.email }));
        
        if (pendingUsers.length === 0) {
            alert('No pending users to notify');
            return;
        }
        
        const appLink = document.getElementById('appLink').value;
        if (!appLink) {
            alert('Please enter the app download link');
            return;
        }
        
        showEmailModal(pendingUsers, appLink);
    });
    
    // Modal close button
    document.querySelector('.close').addEventListener('click', () => {
        document.getElementById('emailModal').style.display = 'none';
    });
    
    // Email form submission
    document.getElementById('emailForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const recipients = JSON.parse(document.getElementById('recipientList').dataset.recipients);
        const appLink = document.getElementById('modalAppLink').value;
        const message = document.getElementById('emailMessage').value;
        
        try {
            const response = await fetch('/api/waitlist/send-emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    recipients: recipients,
                    appLink: appLink,
                    message: message
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                alert(`Emails sent successfully!\n\nSent: ${result.sent}\nFailed: ${result.failed}\n\nEmails sent from: lars@lanian.ch`);
                
                // Refresh the data to show updated notification status
                await loadWaitlistData();
                updateStats();
            } else {
                alert(`Error sending emails: ${result.error}`);
            }
        } catch (error) {
            console.error('Email sending error:', error);
            alert('Failed to send emails. Please check your email configuration.');
        }
        
        document.getElementById('emailModal').style.display = 'none';
        selectedUsers.clear();
        document.querySelectorAll('.user-checkbox').forEach(cb => cb.checked = false);
    });
}

// Show email modal
function showEmailModal(recipients, appLink) {
    const modal = document.getElementById('emailModal');
    const recipientList = document.getElementById('recipientList');
    const modalAppLink = document.getElementById('modalAppLink');
    
    // Set recipients
    recipientList.innerHTML = recipients.map(r => r.email).join('<br>');
    recipientList.dataset.recipients = JSON.stringify(recipients);
    
    // Set app link
    modalAppLink.value = appLink;
    
    // Set default message
    document.getElementById('emailMessage').value = 
        `Hi there!\n\nGreat news! CorHRV is now ready for download.\n\nYou can download the app here: ${appLink}\n\nThank you for your patience and support!\n\nBest regards,\nThe CorHRV Team`;
    
    modal.style.display = 'block';
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    const modal = document.getElementById('emailModal');
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});
