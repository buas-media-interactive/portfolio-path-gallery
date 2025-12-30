// gallery.js for browse all page
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, get, set } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import firebaseConfig from './firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

let allProjects = [];
let filteredProjects = [];

// Load projects data
async function loadProjects() {
    try {
        const response = await fetch('./data/projects.json');
        const data = await response.json();
        allProjects = data.projects;
        filteredProjects = [...allProjects];
        
        displayGallery();
    } catch (error) {
        console.error('Error loading projects:', error);
        document.getElementById('gallery-grid').innerHTML = '<p>Error loading projects. Please refresh the page.</p>';
    }
}

// Display gallery grid
async function displayGallery() {
    const galleryGrid = document.getElementById('gallery-grid');
    
    if (filteredProjects.length === 0) {
        galleryGrid.innerHTML = '<p class="loading">No projects match your filters.</p>';
        updateResultsCount();
        return;
    }
    
    galleryGrid.innerHTML = '';
    
    for (const project of filteredProjects) {
        const galleryItem = createGalleryItem(project);
        galleryGrid.appendChild(galleryItem);
        
        // Load view count for each project
        loadViewCount(project.id);
    }
    
    updateResultsCount();
}

// Create gallery item element
function createGalleryItem(project) {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.dataset.projectId = project.id;
    
    // Determine file extension for thumbnail
    const fileExt = project.fileName.split('.').pop().toLowerCase();
    let thumbnailSrc = '';
    
    if (fileExt === 'pdf') {
        // For PDFs, we'll show a placeholder or first page (if available)
        thumbnailSrc = './assets/pdf-placeholder.png'; // You'll need to add this image
    } else {
        thumbnailSrc = `./projects/${project.fileName}`;
    }
    
    const staffPickBadge = project.staffPick ? '<span class="badge badge-staff-pick">Staff Pick</span>' : '';
    
    item.innerHTML = `
        <img src="${thumbnailSrc}" alt="${project.projectTitle}" class="gallery-item-image" 
             onerror="this.src='./assets/placeholder.png'">
        <div class="gallery-item-info">
            <h4>${project.projectTitle}</h4>
            <p><strong>${project.firstName} ${project.lastName}</strong></p>
            <div class="project-meta">
                <span class="badge badge-type">${project.projectType}</span>
                <span class="badge badge-category">${project.category}</span>
                <span class="badge badge-year">${project.year}</span>
                ${staffPickBadge}
            </div>
            <p class="view-count" id="gallery-view-${project.id}">Loading...</p>
        </div>
    `;
    
    // Add click event to open modal
    item.addEventListener('click', () => openProjectModal(project));
    
    return item;
}

// Load view count from Firebase
async function loadViewCount(projectId) {
    try {
        const viewRef = ref(database, `views/${projectId}`);
        const snapshot = await get(viewRef);
        
        let views = 0;
        if (snapshot.exists()) {
            views = snapshot.val();
        }
        
        const viewElement = document.getElementById(`gallery-view-${projectId}`);
        if (viewElement) {
            viewElement.textContent = `👁 ${views} views`;
        }
    } catch (error) {
        console.error('Error loading view count:', error);
    }
}

// Open project in modal
function openProjectModal(project) {
    // Get Bootstrap modal instance
    const modalElement = document.getElementById('project-modal');
    const modal = new bootstrap.Modal(modalElement);
    const modalBody = document.getElementById('modal-body');
    
    // Increment view count
    incrementViewCount(project.id);
    
    // Determine file type and display accordingly
    const fileExt = project.fileName.split('.').pop().toLowerCase();
    let mediaElement = '';
    
    if (fileExt === 'pdf') {
        mediaElement = `<embed src="./projects/${project.fileName}" type="application/pdf" width="100%" height="800px" class="mb-3" />`;
    } else {
        mediaElement = `<img src="./projects/${project.fileName}" alt="${project.projectTitle}" class="modal-project-image" />`;
    }
    
    const staffPickBadge = project.staffPick ? '<span class="badge badge-staff-pick">Staff Pick</span>' : '';
    
    modalBody.innerHTML = `
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
            <p class="view-count" id="modal-view-${project.id}">Loading views...</p>
        </div>
    `;
    
    modal.show();
}

// Increment view count
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
        
        // Update all view count displays for this project
        const viewElements = [
            document.getElementById(`modal-view-${projectId}`),
            document.getElementById(`gallery-view-${projectId}`)
        ];
        
        viewElements.forEach(element => {
            if (element) {
                element.textContent = `👁 ${newViews} views`;
            }
        });
    } catch (error) {
        console.error('Error updating view count:', error);
    }
}

// Filter projects
function applyFilters() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const projectType = document.getElementById('project-type-filter').value;
    const category = document.getElementById('category-filter').value;
    const year = document.getElementById('year-filter').value;
    const staffPick = document.getElementById('staff-pick-filter').value;
    
    filteredProjects = allProjects.filter(project => {
        // Search filter
        const matchesSearch = !searchTerm || 
            project.firstName.toLowerCase().includes(searchTerm) ||
            project.lastName.toLowerCase().includes(searchTerm) ||
            project.projectTitle.toLowerCase().includes(searchTerm);
        
        // Type filter
        const matchesType = !projectType || project.projectType === projectType;
        
        // Category filter
        const matchesCategory = !category || project.category === category;
        
        // Year filter
        const matchesYear = !year || project.year === year;
        
        // Staff pick filter
        const matchesStaffPick = !staffPick || (staffPick === 'yes' && project.staffPick);
        
        return matchesSearch && matchesType && matchesCategory && matchesYear && matchesStaffPick;
    });
    
    displayGallery();
}

// Clear all filters
function clearFilters() {
    document.getElementById('search-input').value = '';
    document.getElementById('project-type-filter').value = '';
    document.getElementById('category-filter').value = '';
    document.getElementById('year-filter').value = '';
    document.getElementById('staff-pick-filter').value = '';
    
    filteredProjects = [...allProjects];
    displayGallery();
}

// Update results count
function updateResultsCount() {
    const resultsCount = document.getElementById('results-count');
    resultsCount.textContent = `Showing ${filteredProjects.length} of ${allProjects.length} projects`;
}

// Event listeners
document.getElementById('search-input').addEventListener('input', applyFilters);
document.getElementById('project-type-filter').addEventListener('change', applyFilters);
document.getElementById('category-filter').addEventListener('change', applyFilters);
document.getElementById('year-filter').addEventListener('change', applyFilters);
document.getElementById('staff-pick-filter').addEventListener('change', applyFilters);
document.getElementById('clear-filters').addEventListener('click', clearFilters);

// Initialize
loadProjects();
