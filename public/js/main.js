// Main JavaScript for CorHRV Waiting List

// DOM Elements
const waitlistForm = document.getElementById('waitlistForm');
const loginModal = document.getElementById('loginModal');
const loginForm = document.getElementById('loginForm');
const adminBtn = document.getElementById('adminBtn');
const closeBtn = document.querySelector('.close');
const waitlistCount = document.getElementById('waitlistCount');
const successMessage = document.getElementById('successMessage');
const loginError = document.getElementById('loginError');

// Load waitlist count on page load
window.addEventListener('DOMContentLoaded', async () => {
    await updateWaitlistCount();
    checkAuthStatus();
});

// Update waitlist count
async function updateWaitlistCount() {
    try {
        const response = await fetch('/api/waitlist/count');
        const data = await response.json();
        const count = data.count;
        
        // Display count starting at 124 and incrementing with real signups
        const displayCount = 124 + count;
        waitlistCount.textContent = displayCount.toString();
    } catch (error) {
        console.error('Error fetching waitlist count:', error);
        waitlistCount.textContent = '124';
    }
}

// Check authentication status
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/auth/check');
        const data = await response.json();
        
        if (data.authenticated) {
            // If already authenticated, change admin button behavior
            adminBtn.textContent = '📊 Dashboard';
            adminBtn.onclick = () => {
                window.location.href = '/admin.html';
            };
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
    }
}

// Handle waitlist form submission
waitlistForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        hrv_tool: document.getElementById('hrv_tool').value
    };
    
    try {
        const response = await fetch('/api/waitlist', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Show success message
            showSuccessMessage();
            
            // Reset form
            waitlistForm.reset();
            
            // Update count
            await updateWaitlistCount();
        } else {
            // Show error message
            alert(data.error || 'Something went wrong. Please try again.');
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        alert('Network error. Please check your connection and try again.');
    }
});

// Show success message
function showSuccessMessage() {
    successMessage.style.display = 'block';
    
    // Hide after 5 seconds
    setTimeout(() => {
        successMessage.style.display = 'none';
    }, 5000);
}

// Admin button click - show login modal
adminBtn.addEventListener('click', async () => {
    const response = await fetch('/api/auth/check');
    const data = await response.json();
    
    if (data.authenticated) {
        // Already logged in, go to admin page
        window.location.href = '/admin.html';
    } else {
        // Show login modal
        loginModal.style.display = 'block';
    }
});

// Close modal when clicking X
closeBtn.addEventListener('click', () => {
    loginModal.style.display = 'none';
    loginError.textContent = '';
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === loginModal) {
        loginModal.style.display = 'none';
        loginError.textContent = '';
    }
});

// Handle login form submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        if (response.ok) {
            // Login successful, redirect to admin page
            window.location.href = '/admin.html';
        } else {
            // Show error message
            loginError.textContent = 'Invalid email or password';
            loginForm.reset();
        }
    } catch (error) {
        console.error('Login error:', error);
        loginError.textContent = 'Network error. Please try again.';
    }
});

// Add smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
