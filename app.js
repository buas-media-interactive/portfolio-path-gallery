// Main app.js for homepage
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, get, set, update } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import firebaseConfig from './firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

let allProjects = [];
let currentFeaturedIndex = -1;

// Load projects data
async function loadProjects() {
    try {
        const response = await fetch('./data/projects.json');
        const data = await response.json();
        allProjects = data.projects;
        
        // Update stats
        updateStats();
        
        // Show random featured project
        showRandomProject();
    } catch (error) {
        console.error('Error loading projects:', error);
        document.getElementById('featured-project').innerHTML = '<p>Error loading projects. Please refresh the page.</p>';
    }
}

// Show a random project that hasn't been shown recently
function showRandomProject() {
    if (allProjects.length === 0) return;
    
    // Get a random index different from current
    let randomIndex;
    do {
        randomIndex = Math.floor(Math.random() * allProjects.length);
    } while (randomIndex === currentFeaturedIndex && allProjects.length > 1);
    
    currentFeaturedIndex = randomIndex;
    const project = allProjects[randomIndex];
    
    displayFeaturedProject(project);
}

// Display featured project
function displayFeaturedProject(project) {
    const featuredDiv = document.getElementById('featured-project');
    
    // Determine file extension and create appropriate element
    const fileExt = project.fileName.split('.').pop().toLowerCase();
    let mediaElement = '';
    
    if (fileExt === 'pdf') {
        mediaElement = `<embed src="./projects/${project.fileName}" type="application/pdf" width="100%" height="600px" />`;
    } else {
        mediaElement = `<img src="./projects/${project.fileName}" alt="${project.projectTitle}" />`;
    }
    
    const staffPickBadge = project.staffPick ? '<span class="badge badge-staff-pick">Staff Pick</span>' : '';
    
    featuredDiv.innerHTML = `
        <div class="project-card">
            ${mediaElement}
            <div class="project-info">
                <h3>${project.projectTitle}</h3>
                <p><strong>By:</strong> ${project.firstName} ${project.lastName}</p>
                <div class="project-meta">
                    <span class="badge badge-type">${project.projectType}</span>
                    <span class="badge badge-category">${project.category}</span>
                    <span class="badge badge-year">${project.year}</span>
                    ${staffPickBadge}
                </div>
                <p class="view-count" id="view-count-${project.id}">Loading views...</p>
            </div>
        </div>
    `;
    
    // Load and increment view count
    incrementViewCount(project.id);
}

// Increment view count in Firebase
async function incrementViewCount(projectId) {
    try {
        const viewRef = ref(database, `views/${projectId}`);
        const snapshot = await get(viewRef);
        
        let currentViews = 0;
        if (snapshot.exists()) {
            currentViews = snapshot.val();
        }
        
        const newViews = currentViews + 1;
        await set(viewRef, newViews);
        
        // Update display
        const viewCountElement = document.getElementById(`view-count-${projectId}`);
        if (viewCountElement) {
            viewCountElement.textContent = `👁 ${newViews} views`;
        }
    } catch (error) {
        console.error('Error updating view count:', error);
        const viewCountElement = document.getElementById(`view-count-${projectId}`);
        if (viewCountElement) {
            viewCountElement.textContent = '';
        }
    }
}

// Update statistics
async function updateStats() {
    // Total projects
    document.getElementById('total-projects').textContent = allProjects.length;
    
    // Staff picks
    const staffPicks = allProjects.filter(p => p.staffPick).length;
    document.getElementById('staff-picks').textContent = staffPicks;
    
    // Total views across all projects
    try {
        const viewsRef = ref(database, 'views');
        const snapshot = await get(viewsRef);
        
        let totalViews = 0;
        if (snapshot.exists()) {
            const viewsData = snapshot.val();
            totalViews = Object.values(viewsData).reduce((sum, views) => sum + views, 0);
        }
        
        document.getElementById('total-views').textContent = totalViews;
    } catch (error) {
        console.error('Error loading total views:', error);
        document.getElementById('total-views').textContent = '—';
    }
}

// Event listeners
document.getElementById('view-another').addEventListener('click', showRandomProject);

// Initialize on page load
loadProjects();
