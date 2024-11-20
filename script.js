// Global function for tab switching
function showTab(tabId) {
    console.log("Switching to tab:", tabId); // Debugging
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => tab.classList.remove('active')); // Hide all tabs
    document.getElementById(tabId).classList.add('active'); // Show the selected tab
}

document.addEventListener("DOMContentLoaded", () => {
    const datasetSelect = document.getElementById("dataset-select");
    const searchInput = document.getElementById("table-filter");
    const tableHeaders = document.getElementById("table-headers");
    const tableBody = document.getElementById("table-body");
    const downloadButton = document.getElementById("download-button");
    const statsDifferencesContainer = document.getElementById("stats-differences");

    let tableData = []; // Store the currently loaded table data
    let currentHeaders = []; // Store the headers
    const governorStats = {}; // Store aggregated governor data

    const repoOwner = "WhiteTigger13"; // Your GitHub username
    const repoName = "rok-stats"; // Your GitHub repository name
    const branchName = "main"; // Your repository's branch name

    const githubApiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/data?ref=${branchName}`;

    // Fetch available files from the GitHub repository
    function fetchAvailableFiles() {
        fetch(githubApiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(files => {
                const csvFiles = files.filter(file => file.name.endsWith(".csv"));
                console.log("CSV Files:", csvFiles); // Debugging
                populateDropdown(csvFiles);
            })
            .catch(err => console.error("Error fetching file list:", err));
    }

    // Populate the dropdown with file names
    function populateDropdown(files) {
        datasetSelect.innerHTML = ""; // Clear existing options
        files.forEach(file => {
            const option = document.createElement("option");
            option.value = file.download_url; // Use the direct download URL
            option.textContent = file.name; // Use the file name as the display name
            datasetSelect.appendChild(option);
        });

        // Automatically load the first file if available
        if (files.length > 0) {
            loadDataset(files[0].download_url);
        }
    }

    // Load dataset from CSV and render table
    function loadDataset(fileUrl) {
        console.log("Loading dataset:", fileUrl); // Debugging

        fetch(fileUrl)
            .then(response => response.text())
            .then(csvText => {
                const rows = csvText.split("\n").map(row => row.split(","));
                currentHeaders = rows.shift(); // Extract headers
                tableData = rows; // Store table data
                console.log("Loaded Data:", tableData); // Debugging
                renderTable(currentHeaders, tableData); // Render the table with all data
                aggregateGovernorStats(fileUrl, rows); // Aggregate data for stats differences
            })
            .catch(err => console.error("Error loading dataset:", err));
    }

    datasetSelect.addEventListener("change", (event) => {
        const selectedFile = event.target.value;
        loadDataset(selectedFile);
    });

    searchInput.addEventListener("input", (event) => {
        filterTable(event.target.value);
    });

    downloadButton.addEventListener("click", () => {
        downloadTableAsExcel();
    });

    // Calculate stats differences for governors
    function calculateStatsDifferences() {
        console.log("Calculating stats differences..."); // Debugging
        statsDifferencesContainer.innerHTML = ""; // Clear previous results

        Object.keys(governorStats).forEach(governorName => {
            const stats = governorStats[governorName];
            if (stats.length < 2) return; // Skip if there's not enough data for comparison

            const latest = stats[stats.length - 1];
            const previous = stats[stats.length - 2];

            const powerChange = latest.power - previous.power;
            const killPointsChange = latest.killPoints - previous.killPoints;
            const deathsChange = latest.deaths - previous.deaths;

            const differenceElement = document.createElement("div");
            differenceElement.innerHTML = `
                <h4>${governorName}</h4>
                <p>Power Change: ${powerChange > 0 ? "+" : ""}${powerChange}</p>
                <p>Kill Points Change: ${killPointsChange > 0 ? "+" : ""}${killPointsChange}</p>
                <p>Deaths Change: ${deathsChange > 0 ? "+" : ""}${deathsChange}</p>
            `;
            statsDifferencesContainer.appendChild(differenceElement);
        });

        console.log("Stats differences calculation complete."); // Debugging
    }

    // Fetch and populate the dropdown on page load
    fetchAvailableFiles();
});
