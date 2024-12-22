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
        fetch(fileUrl)
            .then(response => response.text())
            .then(csvText => {
                const rows = csvText.split("\n").map(row => row.split(","));
                currentHeaders = rows.shift(); // Extract headers
                tableData = rows; // Store table data
                renderTable(currentHeaders, tableData);
            })
            .catch(err => {
                console.error("Error loading dataset:", err);
                renderErrorMessage("Failed to load dataset.");
            });
    }

    // Render error message in table
    function renderErrorMessage(message) {
        tableHeaders.innerHTML = ""; // Clear headers
        tableBody.innerHTML = `<tr><td colspan="100%" style="color:red; text-align:center;">${message}</td></tr>`;
    }

    datasetSelect.addEventListener("change", (event) => {
        const selectedFile = event.target.value;
        if (selectedFile) {
            loadDataset(selectedFile);
        }
    });

    searchInput.addEventListener("input", (event) => {
        filterTable(event.target.value);
    });

    downloadButton.addEventListener("click", () => {
        downloadTableAsExcel();
    });

    // Render the table with headers and rows
    function renderTable(headers, rows) {
        renderTableHeaders(headers);
        renderTableBody(rows);
    }

    // Render table headers
    function renderTableHeaders(headers) {
        tableHeaders.innerHTML = ""; // Clear existing headers
        headers.forEach(header => {
            const th = document.createElement("th");
            th.textContent = header.trim();
            tableHeaders.appendChild(th);
        });
    }

   // Render table body with number formatting for numeric values
function renderTableBody(rows) {
    tableBody.innerHTML = ""; // Clear existing rows

    rows.forEach(row => {
        const tr = document.createElement("tr");
        row.forEach((cell, index) => {
            const td = document.createElement("td");

            // Apply thousand separator formatting for numeric columns (except columns 1 and 2)
            if (index >= 2 && !isNaN(cell) && cell.trim() !== "") {
                td.textContent = formatNumberWithSeparators(cell.trim());
            } else {
                td.textContent = cell.trim();
            }

            tr.appendChild(td);
        });
        tableBody.appendChild(tr);
    });
}

// Helper function to add thousand separators to numbers
function formatNumberWithSeparators(value) {
    return parseInt(value, 10).toLocaleString("en-US");
}
    // Filter the table based on search input
    function filterTable(query) {
        const filteredRows = tableData.filter(row =>
            row.some(cell => cell.toLowerCase().includes(query.toLowerCase()))
        );
        renderTableBody(filteredRows);
    }

    // Download the visible table as CSV
    function downloadTableAsExcel() {
        const rows = [currentHeaders, ...tableData]; // Include headers and data
        const csvContent = rows.map(row => row.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "table_data.csv";
        link.click();
    }

    fetchAvailableFiles();
});
