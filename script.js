// Pixabay API configuration
const PIXABAY_API_KEY = '49314881-8fdf4c24e6d30b7b907a58fce';
const PIXABAY_URL = 'https://pixabay.com/api/';
const IMAGES_PER_PAGE = 40;

let currentImage = null;
let currentView = 'grid';

// Load trending images when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadTrendingImages();
    setupViewToggle();
    updateHeroBackground();
});

// Update hero background periodically
function updateHeroBackground() {
    const tags = ['nature', 'travel', 'city', 'technology', 'abstract'];
    let currentIndex = 0;
    
    setInterval(() => {
        currentIndex = (currentIndex + 1) % tags.length;
        const heroSection = document.querySelector('.hero-section');
        heroSection.style.backgroundImage = `linear-gradient(135deg, rgba(0,0,0,0.7), rgba(0,0,0,0.8)), url('https://source.unsplash.com/random/1920x1080/?${tags[currentIndex]}')`;
    }, 10000);
}

// Setup view toggle buttons
function setupViewToggle() {
    document.querySelectorAll('.view-toggle .view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const results = document.getElementById('results');
            results.className = view === 'grid' ? 'image-grid' : 'image-masonry';
            currentView = view;
        });
    });
}

// Add search button click handler
document.getElementById('searchButton').addEventListener('click', handleSearch);

// Add search input enter key handler
document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
});

// Add click handlers for trending tags
document.querySelectorAll('.tag-btn').forEach(button => {
    button.addEventListener('click', () => {
        const tag = button.dataset.tag;
        document.getElementById('searchInput').value = tag;
        handleSearch();
    });
});

function handleSearch() {
    const searchInput = document.getElementById('searchInput').value.trim();
    if (searchInput) {
        showLoadingSpinner();
        fetchImages(searchInput);
    }
}

function showLoadingSpinner() {
    const spinner = document.getElementById('loadingSpinner');
    spinner.style.display = 'flex';
}

function hideLoadingSpinner() {
    const spinner = document.getElementById('loadingSpinner');
    spinner.style.display = 'none';
}

async function loadTrendingImages() {
    try {
        showLoadingSpinner();
        const categories = ['nature', 'travel', 'animals', 'food', 'technology'];
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        await fetchImages(randomCategory, true);
    } catch (error) {
        console.error('Error loading trending images:', error);
        displayError();
    } finally {
        hideLoadingSpinner();
    }
}

async function fetchImages(query, isTrending = false) {
    try {
        const url = new URL(PIXABAY_URL);
        url.searchParams.append('key', PIXABAY_API_KEY);
        url.searchParams.append('q', query);
        url.searchParams.append('per_page', IMAGES_PER_PAGE);
        url.searchParams.append('safesearch', 'true');
        if (isTrending) {
            url.searchParams.append('order', 'popular');
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        if (!data.hits || data.hits.length === 0) {
            displayNoResults();
            return;
        }

        displayResults(data.hits);
        updateResultsTitle(isTrending ? 'Trending Images' : `${query.charAt(0).toUpperCase() + query.slice(1)} Pictures`);
    } catch (error) {
        console.error('Error fetching images:', error);
        displayError();
    } finally {
        hideLoadingSpinner();
    }
}

function displayResults(images) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';
    
    images.forEach((image, index) => {
        const delay = index * 100; // Stagger animation
        const card = createImageCard(image);
        card.style.animationDelay = `${delay}ms`;
        resultsDiv.appendChild(card);
    });
}

function createImageCard(image) {
    const card = document.createElement('div');
    card.className = 'image-card';
    
    card.innerHTML = `
        <div class="image-wrapper">
            <img src="${image.webformatURL}" alt="${image.tags}" loading="lazy">
            <div class="image-overlay">
                <div class="overlay-stats">
                    <span><i class="far fa-heart"></i> ${formatNumber(image.likes)}</span>
                    <span><i class="far fa-eye"></i> ${formatNumber(image.views)}</span>
                </div>
                <div class="overlay-buttons">
                    <button class="overlay-btn download-btn">
                        <i class="fas fa-download"></i> Download
                    </button>
                    <button class="overlay-btn view-btn">
                        <i class="fas fa-external-link-alt"></i> View
                    </button>
                </div>
            </div>
        </div>
        <div class="image-info">
            <div class="tags"> 📌 ${image.tags}</div>
            <div class="stats">
                <span> 👁️ ${formatNumber(image.views)}</span>
                <span> ❤️ ${formatNumber(image.likes)}</span>
            </div>
        </div>
    `;

    // Add click handlers
    const downloadBtn = card.querySelector('.download-btn');
    const viewBtn = card.querySelector('.view-btn');
    const imageWrapper = card.querySelector('.image-wrapper');

    downloadBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Downloading...';
        downloadBtn.disabled = true;
        
        try {
            await downloadImage(image);
            downloadBtn.innerHTML = '<i class="fas fa-check"></i> Done!';
            setTimeout(() => {
                downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download';
                downloadBtn.disabled = false;
            }, 2000);
        } catch (error) {
            downloadBtn.innerHTML = '<i class="fas fa-times"></i> Failed';
            setTimeout(() => {
                downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download';
                downloadBtn.disabled = false;
            }, 2000);
        }
    });

    viewBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        viewBtn.innerHTML = '<i class="fas fa-external-link-alt"></i> Opening...';
        openPixabayPage(image);
        setTimeout(() => {
            viewBtn.innerHTML = '<i class="fas fa-external-link-alt"></i> View';
        }, 2000);
    });

    imageWrapper.addEventListener('click', () => showImageModal(image));

    return card;
}

async function showImageModal(image) {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const modalViews = document.getElementById('modalViews');
    const modalLikes = document.getElementById('modalLikes');
    const modalDownloads = document.getElementById('modalDownloads');

    // Set current image for download
    currentImage = image;

    // Update modal content
    modalImage.src = image.largeImageURL;
    modalViews.textContent = formatNumber(image.views);
    modalLikes.textContent = formatNumber(image.likes);
    modalDownloads.textContent = formatNumber(image.downloads);

    // Show modal with animation
    modal.style.display = 'block';
    setTimeout(() => modal.classList.add('show'), 10);

    // Load related images
    try {
        const relatedImages = await searchImages(image.tags.split(',')[0], 6);
        displayRelatedImages(relatedImages.filter(img => img.id !== image.id));
    } catch (error) {
        console.error('Error loading related images:', error);
    }
}

function displayRelatedImages(images) {
    const relatedGrid = document.getElementById('relatedGrid');
    relatedGrid.innerHTML = '';

    images.slice(0, 5).forEach((image, index) => {
        const delay = index * 100;
        const relatedImage = document.createElement('div');
        relatedImage.className = 'related-image';
        relatedImage.style.animationDelay = `${delay}ms`;
        
        relatedImage.innerHTML = `
            <img src="${image.webformatURL}" alt="${image.tags}">
            <div class="image-overlay">
                <div class="image-stats">
                    <span><i class="far fa-eye"></i> ${formatNumber(image.views)}</span>
                    <span><i class="far fa-heart"></i> ${formatNumber(image.likes)}</span>
                </div>
            </div>
        `;
        
        // Add click event to show modal
        relatedImage.addEventListener('click', (e) => {
            e.preventDefault();
            // Close current modal
            const modal = document.getElementById('imageModal');
            modal.classList.remove('show');
            
            // Show new modal after a short delay
            setTimeout(() => {
                showImageModal(image);
            }, 300);
        });

        relatedGrid.appendChild(relatedImage);
    });
}

async function searchImages(query, perPage) {
    try {
        const url = new URL(PIXABAY_URL);
        url.searchParams.append('key', PIXABAY_API_KEY);
        url.searchParams.append('q', query);
        url.searchParams.append('per_page', perPage);
        url.searchParams.append('safesearch', 'true');

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        if (!data.hits || data.hits.length === 0) {
            return [];
        }

        return data.hits;
    } catch (error) {
        console.error('Error searching images:', error);
        return [];
    }
}

async function downloadImage(image) {
    try {
        const response = await fetch(image.largeImageURL);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `picdown-${image.id}.jpg`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Error downloading image:', error);
        alert('Failed to download image. Please try again.');
        throw error;
    }
}

function openPixabayPage(image) {
    if (image && image.pageURL) {
        window.open(image.pageURL, '_blank');
    }
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function updateResultsTitle(title) {
    document.getElementById('resultsTitle').textContent = title;
}

function displayError() {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '<div class="error-message">😕 Oops! Something went wrong. Please try again.</div>';
}

function displayNoResults() {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '<div class="error-message">😔 No images found. Try a different search term.</div>';
}

// Modal event listeners
document.getElementById('imageModal').addEventListener('click', (e) => {
    if (e.target.id === 'imageModal') {
        closeImageModal();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeImageModal();
    }
});

function closeImageModal() {
    const modal = document.getElementById('imageModal');
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
}
