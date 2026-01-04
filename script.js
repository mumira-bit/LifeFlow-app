
const CATEGORY_COLORS = {
    work: { hex: '#3b82f6', rgb: '59, 130, 246', name: 'Work' },
    health: { hex: '#22c55e', rgb: '34, 197, 94', name: 'Health & Fitness' },
    learning: { hex: '#a855f7', rgb: '168, 85, 247', name: 'Learning' },
    leisure: { hex: '#f59e0b', rgb: '245, 158, 11', name: 'Leisure' },
    family: { hex: '#ec4899', rgb: '236, 72, 153', name: 'Family' },
    outdoor: { hex: '#10b981', rgb: '16, 185, 129', name: 'Outdoor' },
    personal: { hex: '#8b5cf6', rgb: '139, 92, 246', name: 'Personal' }
};



class ActivityManager {
    constructor() {
        this.activities = this.loadActivities();
    }

    loadActivities() {
        const stored = localStorage.getItem('lifeflow_activities');
        return stored ? JSON.parse(stored) : [];
    }

    saveActivities() {
        localStorage.setItem('lifeflow_activities', JSON.stringify(this.activities));
    }

    addActivity(activity) {
        const newActivity = {
            id: Date.now(),
            ...activity,
            createdAt: new Date().toISOString()
        };
        this.activities.push(newActivity);
        this.saveActivities();
        return newActivity;
    }

    deleteActivity(id) {
        this.activities = this.activities.filter(a => a.id !== id);
        this.saveActivities();
    }

    getActivitiesToday() {
        return this.activities.filter(a => {
            const activityDate = new Date(a.createdAt).toDateString();
            const today = new Date().toDateString();
            return activityDate === today;
        });
    }

    calculateBalance() {
        const activitiesCount = this.activities.length;
        const baseScore = 45;
        const increment = Math.min(activitiesCount * 5, 55);
        return Math.min(baseScore + increment, 100);
    }
}



const activityManager = new ActivityManager();

// Modal Management
function openActivityModal() {
    const modal = document.getElementById('activityModal');
    modal.classList.add('active');
    document.getElementById('activityName').focus();
}

function closeActivityModal() {
    const modal = document.getElementById('activityModal');
    modal.classList.remove('active');
    document.getElementById('activityForm').reset();
}

function showToast(message) {
    const toast = document.getElementById('successToast');
    const toastMessage = document.getElementById('toastMessage');
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Section Navigation
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section-view').forEach(view => {
        view.classList.remove('active');
    });
    
    // Show selected section
    const section = document.querySelector(`[data-section="${sectionName}"]`);
    if (section) {
        section.classList.add('active');
    }
    
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(nav => {
        nav.classList.remove('active');
    });
    
    const activeNav = document.querySelector(`[data-nav="${sectionName}"]`);
    if (activeNav) {
        activeNav.classList.add('active');
    }

    // If showing activities, render the list
    if (sectionName === 'activities') {
        renderActivitiesList();
        renderTimeline();
    }
}

// Activities List Rendering
function renderActivitiesList() {
    const container = document.getElementById('activitiesList');
    const activities = activityManager.activities.sort((a, b) => a.time.localeCompare(b.time));
    
    if (activities.length === 0) {
        container.innerHTML = '<p class="empty-state">No activities scheduled yet. Create one to get started!</p>';
        return;
    }
    
    container.innerHTML = activities.map(activity => `
        <div class="activity-item category-${activity.category}">
            <div class="activity-item-content">
                <div class="activity-item-name">${escapeHtml(activity.name)}</div>
                <div class="activity-item-meta">
                    <span><i class="fas fa-clock"></i> ${activity.time}</span>
                    <span><i class="fas fa-hourglass-half"></i> ${activity.duration}m</span>
                    <span class="activity-item-category badge-${activity.category}">${CATEGORY_COLORS[activity.category].name}</span>
                </div>
                ${activity.note ? `<p style="color: #94a3b8; font-size: 12px; margin-top: 8px;">${escapeHtml(activity.note)}</p>` : ''}
            </div>
            <div class="activity-item-actions">
                <button class="btn-delete" onclick="deleteActivity(${activity.id})" title="Delete activity">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Timeline Rendering
function renderTimeline() {
    const container = document.getElementById('timelineContainer');
    const activities = activityManager.activities;
    
    if (activities.length === 0) {
        container.innerHTML = '<p class="empty-state">No activities scheduled yet. Create one to get started!</p>';
        return;
    }
    
    // Create hourly grid
    const hours = {};
    for (let i = 0; i < 24; i++) {
        hours[i] = [];
    }
    
    // Populate hours with activities
    activities.forEach(activity => {
        const [hour] = activity.time.split(':');
        const hourNum = parseInt(hour);
        hours[hourNum].push(activity);
    });
    
    // Generate HTML
    const timelineHTML = Object.entries(hours)
        .map(([hour, hourActivities]) => {
            const hourNum = parseInt(hour);
            const displayHour = hourNum === 0 ? '12 AM' : hourNum < 12 ? `${hourNum} AM` : hourNum === 12 ? '12 PM' : `${hourNum - 12} PM`;
            
            const dotsHTML = hourActivities.map(activity => {
                const color = CATEGORY_COLORS[activity.category].hex;
                return `<div class="timeline-activity-dot" style="background: ${color};" title="${activity.name}"></div>`;
            }).join('');
            
            return `
                <div class="timeline-hour">
                    <div class="timeline-time">${displayHour}</div>
                    <div class="timeline-activities">${dotsHTML || '<div style="width: 6px; height: 6px; background: rgba(148, 163, 184, 0.3); border-radius: 50%;"></div>'}</div>
                </div>
            `;
        })
        .join('');
    
    container.innerHTML = `<div class="timeline-grid">${timelineHTML}</div>`;
}

function deleteActivity(id) {
    if (confirm('Are you sure you want to delete this activity?')) {
        activityManager.deleteActivity(id);
        renderActivitiesList();
        renderTimeline();
        updateMetrics();
        showToast('Activity deleted');
    }
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}


function updateMetrics() {
    const activitiesCount = activityManager.activities.length;
    const totalDuration = activityManager.activities.reduce((sum, a) => sum + a.duration, 0);
    const outdoorActivities = activityManager.activities.filter(a => a.category === 'outdoor');
    const outdoorDuration = outdoorActivities.reduce((sum, a) => sum + a.duration, 0);
    
    // Update activities count
    const activitiesValue = document.getElementById('activitiesCount');
    if (activitiesCount === 0) {
        activitiesValue.textContent = '0 planned';
    } else {
        activitiesValue.textContent = `${activitiesCount} planned`;
    }
    
    // Update outdoor time
    document.getElementById('outdoorTime').textContent = formatDuration(outdoorDuration);
    
    // Update balance score
    const balanceScore = activityManager.calculateBalance();
    document.getElementById('balanceScore').textContent = balanceScore;
    document.getElementById('progressFill').style.width = `${balanceScore}%`;
    
    // Update progress color based on score
    const progressFill = document.getElementById('progressFill');
    if (balanceScore < 50) {
        progressFill.style.background = 'linear-gradient(to right, #ef4444, #f87171)';
    } else if (balanceScore < 75) {
        progressFill.style.background = 'linear-gradient(to right, #f59e0b, #fbbf24)';
    } else {
        progressFill.style.background = 'linear-gradient(to right, #10b981, #34d399)';
    }
}

function formatDuration(minutes) {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}


function updateCurrentTime() {
    const now = new Date();
    const timeElement = document.querySelector('.time');
    const contextElement = document.querySelector('.time-context');
    
    // Format time
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    timeElement.textContent = `${hours}:${minutes}`;
    
    // Update context based on time
    const currentHour = now.getHours();
    if (currentHour >= 18 || currentHour < 6) {
        contextElement.textContent = 'During your shift';
    } else if (currentHour >= 6 && currentHour < 14) {
        contextElement.textContent = 'Recovery time';
    } else {
        contextElement.textContent = 'Free time';
    }
}

function updateEnergyLevel() {
    const now = new Date();
    const hour = now.getHours();
    const energyStat = document.querySelector('.energy-stat');
    
    if (hour >= 22 || hour < 4) {
        energyStat.textContent = 'Energy: Low';
    } else if (hour >= 4 && hour < 10) {
        energyStat.textContent = 'Energy: High';
    } else {
        energyStat.textContent = 'Energy: Medium';
    }
}



// Modal controls
document.getElementById('closeModal').addEventListener('click', closeActivityModal);
document.getElementById('cancelForm').addEventListener('click', closeActivityModal);

// Close modal when clicking outside
document.getElementById('activityModal').addEventListener('click', (e) => {
    if (e.target.id === 'activityModal') {
        closeActivityModal();
    }
});

// Form submission
document.getElementById('activityForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const activity = {
        name: document.getElementById('activityName').value,
        time: document.getElementById('activityTime').value,
        duration: parseInt(document.getElementById('activityDuration').value),
        category: document.getElementById('activityCategory').value,
        note: document.getElementById('activityNote').value
    };
    
    activityManager.addActivity(activity);
    closeActivityModal();
    updateMetrics();
    if (document.querySelector('[data-section="activities"]').classList.contains('active')) {
        renderActivitiesList();
        renderTimeline();
    }
    showToast(`"${activity.name}" added successfully!`);
});

// Navigation
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionName = item.getAttribute('data-nav');
        showSection(sectionName);
    });
});

// Add activity buttons
document.querySelectorAll('.btn-add-activity, .cta-button').forEach(btn => {
    btn.addEventListener('click', () => {
        openActivityModal();
    });
});


document.addEventListener('DOMContentLoaded', () => {
    // Set default nav to timeline
    document.querySelector('[data-nav="timeline"]').classList.add('active');
    
    // Initial updates
    updateCurrentTime();
    updateEnergyLevel();
    updateMetrics();
    
    // Set current time in time input
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    document.getElementById('activityTime').value = `${hours}:${minutes}`;
    
    // Periodic updates
    setInterval(updateCurrentTime, 60000);
    setInterval(updateEnergyLevel, 1800000);
});