// Mermaid initialization
mermaid.initialize({ startOnLoad: false, theme: 'dark' });

// Function to handle API Key input and storage
window.getApiKey = function() {
    let key = localStorage.getItem('GEMINI_KEY');
    if (!key || key === "null" || key.trim() === "") {
        key = prompt("Please enter your Google Gemini API Key:");
        if (key && key.trim() !== "") {
            localStorage.setItem('GEMINI_KEY', key.trim());
        }
    }
    return key;
};

// Function to reset API Key from Sidebar button
window.resetApiKey = function() {
    localStorage.removeItem('GEMINI_KEY');
    alert("API Key reset successfully! Enter your new key on the next search.");
};

// Retry Mechanism for Gemini API (503 handling)
async function fetchWithRetry(url, options, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        const response = await fetch(url, options);
        if (response.status !== 503) return response;
        await new Promise(res => setTimeout(res, delay * (i + 1)));
    }
    return fetch(url, options);
}

// MAIN SEARCH FUNCTION
window.searchTopic = async function() {
    const inputElement = document.getElementById('topicInput');
    const topic = inputElement ? inputElement.value.trim() : '';

    if (!topic) {
        alert('Please enter a topic to search!');
        return;
    }

    const GEMINI_API_KEY = window.getApiKey();
    if (!GEMINI_API_KEY) {
        alert("API Key is required to fetch content!");
        return;
    }

    const notesContainer = document.getElementById('notesContainer');
    const flowchartContainer = document.getElementById('flowchartContainer');
    const youtubeContainer = document.getElementById('youtubeContainer');

    // UI Loading States
    if (notesContainer) {
        notesContainer.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-info" role="status"></div>
                <p class="mt-2 text-white-50">Fetching AI notes for "${topic}"...</p>
            </div>`;
    }
        
    if (flowchartContainer) {
        flowchartContainer.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-success" role="status"></div>
                <p class="mt-2 text-white-50">Generating concept map...</p>
            </div>`;
    }

    if (youtubeContainer) {
        youtubeContainer.innerHTML = `
            <div class="col-12 text-center py-3">
                <div class="spinner-border text-danger spinner-border-sm" role="status"></div>
                <span class="ms-2 text-white-50">Finding recommended lectures...</span>
            </div>`;
    }

    const promptText = `Return ONLY valid JSON with no markdown block or extra text. Topic: "${topic}".
JSON structure:
{
  "notes": "<ul><li><strong>Overview:</strong> Comprehensive introduction to ${topic}</li><li><strong>Core Pillars:</strong> Key architecture and working details</li><li><strong>Summary:</strong> Quick examination takeaways</li></ul>",
  "flowchart": "graph TD\\nA[${topic}] --> B[Core Pillar 1]\\nA --> C[Core Pillar 2]\\nB --> D[Details & Examples]"
}`;

    try {
        const response = await fetchWithRetry(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: promptText }] }]
                })
            }
        );

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        let rawText = data.candidates[0].content.parts[0].text;
        rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsedData = JSON.parse(rawText);

        // Render Notes
        if (notesContainer) {
            notesContainer.innerHTML = `
                <h6 class="text-info fw-bold">Topic: ${topic}</h6>
                <div class="mt-3 text-light">${parsedData.notes}</div>
            `;
        }

        // Render Mermaid Diagram
        if (flowchartContainer) {
            flowchartContainer.innerHTML = `<div class="mermaid">${parsedData.flowchart}</div>`;
            mermaid.run();
        }

        // Render YouTube Video Recommendations
        if (youtubeContainer) {
            const ytQuery = encodeURIComponent(`${topic} tutorial lecture`);
            youtubeContainer.innerHTML = `
                <div class="col-md-6">
                    <div class="p-3 bg-secondary bg-opacity-25 rounded border border-secondary d-flex align-items-center justify-content-between">
                        <div>
                            <h6 class="mb-1 text-white"><i class="fa-brands fa-youtube text-danger me-2"></i>${topic} - Full Concept Lecture</h6>
                            <small class="text-white-50">YouTube Search Result</small>
                        </div>
                        <a href="https://www.youtube.com/results?search_query=${ytQuery}" target="_blank" class="btn btn-sm btn-danger"><i class="fa-solid fa-play me-1"></i> Watch</a>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="p-3 bg-secondary bg-opacity-25 rounded border border-secondary d-flex align-items-center justify-content-between">
                        <div>
                            <h6 class="mb-1 text-white"><i class="fa-brands fa-youtube text-danger me-2"></i>${topic} - Crash Course</h6>
                            <small class="text-white-50">YouTube Search Result</small>
                        </div>
                        <a href="https://www.youtube.com/results?search_query=${ytQuery}" target="_blank" class="btn btn-sm btn-danger"><i class="fa-solid fa-play me-1"></i> Watch</a>
                    </div>
                </div>
            `;
        }

    } catch (error) {
        console.error("API Error:", error);
        if (notesContainer) {
            notesContainer.innerHTML = `<p class="text-danger">Failed to fetch notes. Check your Gemini API Key or try resetting it. <button onclick="window.resetApiKey()" class="btn btn-sm btn-outline-light ms-2">Reset Key</button></p>`;
        }
        if (flowchartContainer) {
            flowchartContainer.innerHTML = `<p class="text-danger">Diagram render error.</p>`;
        }
        if (youtubeContainer) {
            youtubeContainer.innerHTML = `<p class="text-white-50 text-center">Unable to load video lectures.</p>`;
        }
    }
};
// Pre-loaded Resources Data
const preLoadedResources = [
    {
        title: "Compiler Design Lexical Analyzer Guide",
        category: "CSE - Sem 7",
        desc: "Complete implementation guide for C-based lexer, tokens, and DFA transition tables.",
        link: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        uploadedBy: "Faculty / Pre-loaded"
    },
    {
        title: "Data Structures & Algorithms Vault",
        category: "CSE Core",
        desc: "Comprehensive hand-written reference notes on Trees, Graphs, and Dynamic Programming.",
        link: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        uploadedBy: "Faculty / Pre-loaded"
    }
];

// Load and Render Resources
window.loadResources = function() {
    const resourceGrid = document.getElementById('resourceGrid');
    if (!resourceGrid) return;

    let userResources = JSON.parse(localStorage.getItem('CAMPUSX_RESOURCES')) || [];
    let allResources = [...preLoadedResources, ...userResources];

    resourceGrid.innerHTML = allResources.map((res, index) => `
        <div class="col-md-4">
            <div class="card p-3 bg-dark text-white border-secondary h-100 shadow-sm d-flex flex-column justify-content-between">
                <div>
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="badge bg-primary">${res.category}</span>
                        <small class="text-white-50"><i class="fa-solid fa-user me-1"></i>${res.uploadedBy}</small>
                    </div>
                    <h5 class="fw-bold mb-2"><i class="fa-solid fa-file-pdf text-danger me-2"></i>${res.title}</h5>
                    <p class="text-white-50 small mb-3">${res.desc}</p>
                </div>
                <div class="pt-2 border-top border-secondary d-flex justify-content-between align-items-center">
                    <a href="${res.link}" target="_blank" class="btn btn-sm btn-outline-info"><i class="fa-solid fa-arrow-up-right-from-square me-1"></i> View / Download</a>
                    ${index >= preLoadedResources.length ? `<button onclick="deleteResource(${index - preLoadedResources.length})" class="btn btn-sm btn-outline-danger" title="Delete Upload"><i class="fa-solid fa-trash"></i></button>` : ''}
                </div>
            </div>
        </div>
    `).join('');
};

// Handle New Uploads
window.handleResourceUpload = function(event) {
    event.preventDefault();
    
    const newResource = {
        title: document.getElementById('resTitle').value.trim(),
        category: document.getElementById('resCategory').value.trim(),
        desc: document.getElementById('resDesc').value.trim(),
        link: document.getElementById('resLink').value.trim(),
        uploadedBy: "Student User"
    };

    let userResources = JSON.parse(localStorage.getItem('CAMPUSX_RESOURCES')) || [];
    userResources.unshift(newResource);
    localStorage.setItem('CAMPUSX_RESOURCES', JSON.stringify(userResources));

    document.getElementById('resourceForm').reset();
    const modalEl = document.getElementById('uploadModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

    window.loadResources();
    alert('Resource uploaded successfully!');
};

// Delete User Uploads
window.deleteResource = function(userIndex) {
    let userResources = JSON.parse(localStorage.getItem('CAMPUSX_RESOURCES')) || [];
    userResources.splice(userIndex, 1);
    localStorage.setItem('CAMPUSX_RESOURCES', JSON.stringify(userResources));
    window.loadResources();
};

document.addEventListener('DOMContentLoaded', () => {
    window.loadResources();
});