// admin.js for staff picks management
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, get } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import firebaseConfig from './firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

let allProjects = [];
let hasChanges = false;

// Load projects data
async function loadProjects() {
    try {
        const response = await fetch('./data/projects.json');
        const data = await response.json();
        allProjects = data.projects;
        
        displayProjectsTable();
    } catch (error) {
        console.error('Error loading projects:', error);
        document.getElementById('projects-table-body').innerHTML = 
            '<tr><td colspan="8">Error loading projects. Please refresh the page.</td></tr>';
    }
}

// Display projects in table
async function displayProjectsTable() {
    const tableBody = document.getElementById('projects-table-body');
    tableBody.innerHTML = '';
    
    for (const project of allProjects) {
        const row = await createTableRow(project);
        tableBody.appendChild(row);
    }
}

// Create table row for project
async function createTableRow(project) {
    const row = document.createElement('tr');
    row.dataset.projectId = project.id;
    
    // Get view count from Firebase
    let views = 0;
    try {
        const viewRef = ref(database, `views/${project.id}`);
        const snapshot = await get(viewRef);
        if (snapshot.exists()) {
            views = snapshot.val();
        }
    } catch (error) {
        console.error('Error loading views:', error);
    }
    
    // Determine thumbnail
    const fileExt = project.fileName.split('.').pop().toLowerCase();
    let thumbnailSrc = '';
    if (fileExt === 'pdf') {
        thumbnailSrc = './assets/pdf-placeholder.png';
    } else {
        thumbnailSrc = `./projects/${project.fileName}`;
    }
    
    const starClass = project.staffPick ? 'is-staff-pick' : 'not-staff-pick';
    
    row.innerHTML = `
        <td><img src="${thumbnailSrc}" alt="${project.projectTitle}" class="project-thumbnail" 
            onerror="this.src='./assets/placeholder.png'"></td>
        <td>${project.firstName} ${project.lastName}</td>
        <td>${project.projectTitle}</td>
        <td><span class="badge badge-type">${project.projectType}</span></td>
        <td><span class="badge badge-category">${project.category}</span></td>
        <td><span class="badge badge-year">${project.year}</span></td>
        <td>👁 ${views}</td>
        <td>
            <span class="toggle-pick ${starClass}" data-project-id="${project.id}">⭐</span>
        </td>
    `;
    
    // Add click event to star
    const star = row.querySelector('.toggle-pick');
    star.addEventListener('click', () => toggleStaffPick(project.id));
    
    return row;
}

// Toggle staff pick status
function toggleStaffPick(projectId) {
    const project = allProjects.find(p => p.id === projectId);
    if (!project) return;
    
    project.staffPick = !project.staffPick;
    
    // Update star display
    const star = document.querySelector(`.toggle-pick[data-project-id="${projectId}"]`);
    if (project.staffPick) {
        star.classList.remove('not-staff-pick');
        star.classList.add('is-staff-pick');
    } else {
        star.classList.remove('is-staff-pick');
        star.classList.add('not-staff-pick');
    }
    
    // Show unsaved changes indicator
    markAsChanged();
}

// Mark that there are unsaved changes
function markAsChanged() {
    hasChanges = true;
    document.getElementById('changes-indicator').classList.remove('d-none');
    document.getElementById('save-changes').classList.remove('d-none');
}

// Save changes to projects.json
function saveChanges() {
    // Create updated JSON structure
    const updatedData = {
        projects: allProjects
    };
    
    // Convert to JSON string with nice formatting
    const jsonString = JSON.stringify(updatedData, null, 2);
    
    // Create download link
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'projects.json';
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Show success message
    alert('Changes saved! Please upload the downloaded projects.json file to replace the existing one in the /data folder.');
    
    // Reset changes indicator
    hasChanges = false;
    document.getElementById('changes-indicator').classList.add('d-none');
    document.getElementById('save-changes').classList.add('d-none');
}

// Event listener for save button
document.getElementById('save-changes').addEventListener('click', saveChanges);

// Warn user if leaving with unsaved changes
window.addEventListener('beforeunload', (e) => {
    if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
    }
});

// Initialize
loadProjects();
