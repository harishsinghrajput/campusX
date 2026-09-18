mermaid.initialize({ startOnLoad: false, theme: 'dark' });

function getApiKey() {
    let key = localStorage.getItem('GEMINI_KEY');
    if (!key || key === "null" || key.trim() === "") {
        key = prompt("Please enter your Google Gemini API Key:");
        if (key && key.trim() !== "") {
            localStorage.setItem('GEMINI_KEY', key.trim());
        }
    }
    return key;
}

function resetApiKey() {
    localStorage.removeItem('GEMINI_KEY');
    alert("API Key reset! Next search will ask for a new key.");
}

async function fetchWithRetry(url, options, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        const response = await fetch(url, options);
        if (response.status !== 503) return response;
        await new Promise(res => setTimeout(res, delay * (i + 1)));
    }
    return fetch(url, options);
}

async function searchTopic() {
    const inputElement = document.getElementById('topicInput');
    const topic = inputElement ? inputElement.value.trim() : '';

    if (!topic) {
        alert('Please enter a topic to search!');
        return;
    }

    const GEMINI_API_KEY = getApiKey();
    if (!GEMINI_API_KEY) {
        alert("API Key is required!");
        return;
    }

    const notesContainer = document.getElementById('notesContainer');
    const flowchartContainer = document.getElementById('flowchartContainer');
    const youtubeContainer = document.getElementById('youtubeContainer');

    notesContainer.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border text-info" role="status"></div>
            <p class="mt-2 text-white-50">Fetching AI study notes for "${topic}"...</p>
        </div>`;
        
    flowchartContainer.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border text-success" role="status"></div>
            <p class="mt-2 text-white-50">Generating concept map...</p>
        </div>`;

    youtubeContainer.innerHTML = `
        <div class="col-12 text-center py-3">
            <div class="spinner-border text-danger spinner-border-sm" role="status"></div>
            <span class="ms-2 text-white-50">Finding video lectures...</span>
        </div>`;

    const promptText = `Return ONLY valid JSON with no markdown block or extra text. Topic: "${topic}".
JSON structure:
{
  "notes": "<ul><li><strong>Overview:</strong> Key overview of ${topic}</li><li><strong>Key Concepts:</strong> Core details</li><li><strong>Summary:</strong> Final takeaways</li></ul>",
  "flowchart": "graph TD\\nA[${topic}] --> B[Core Pillar 1]\\nA --> C[Core Pillar 2]\\nB --> D[Subtopic Details]"
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

        notesContainer.innerHTML = `
            <h6 class="text-primary fw-bold">Topic: ${topic}</h6>
            <div class="mt-3 text-light">${parsedData.notes}</div>
        `;

        flowchartContainer.innerHTML = `<div class="mermaid">${parsedData.flowchart}</div>`;
        mermaid.run();

        // Populate YouTube Suggestions
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
                        <h6 class="mb-1 text-white"><i class="fa-brands fa-youtube text-danger me-2"></i>${topic} - Quick Revision</h6>
                        <small class="text-white-50">YouTube Search Result</small>
                    </div>
                    <a href="https://www.youtube.com/results?search_query=${ytQuery}" target="_blank" class="btn btn-sm btn-danger"><i class="fa-solid fa-play me-1"></i> Watch</a>
                </div>
            </div>
        `;

    } catch (error) {
        console.error("API Error:", error);
        notesContainer.innerHTML = `<p class="text-danger">Failed to fetch notes. <button onclick="resetApiKey()" class="btn btn-sm btn-outline-light ms-2">Reset API Key</button></p>`;
        flowchartContainer.innerHTML = `<p class="text-danger">Diagram render error.</p>`;
        youtubeContainer.innerHTML = `<p class="text-white-50 text-center">Unable to load videos.</p>`;
    }
}