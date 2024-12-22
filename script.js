document.addEventListener("DOMContentLoaded", () => {
    const datasetSelect = document.getElementById("dataset-select");
    const tableHeaders = document.getElementById("table-headers");
    const tableBody = document.getElementById("table-body");

    const repoOwner = "WhiteTigger13";
    const repoName = "rok-stats";
    const branchName = "main";
    const dataPath = "data";

    const githubApiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${dataPath}?ref=${branchName}`;

    let tableData = []; // Store table rows globally
    let currentHeaders = []; // Store table headers globally
    let sortDirection = 1; // 1 for ascending, -1 for descending

    function fetchAvailableFiles() {
        console.log("Fetching files from:", githubApiUrl);

        fetch(githubApiUrl, { headers: { Accept: "application/vnd.github.v3+json" } })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error fetching file list: ${response.statusText}`);
                }
                return response.json();
            })
            .then(files => {
                console.log("Fetched files:", files);

                const csvFiles = files.filter(file => file.name.endsWith(".csv"));
                if (csvFiles.length === 0) {
                    console.error("No CSV files found in the directory.");
                    return;
                }

                populateDropdown(csvFiles);
            })
            .catch(err => console.error("Error fetching files:", err));
    }

    function populateDropdown(files) {
        datasetSelect.innerHTML = "";
        files.forEach(file => {
            const option = document.createElement("option");
            option.value = file.download_url;
            option.textContent = file.name.replace(/_/g, " ").replace(".csv", "");
            datasetSelect.appendChild(option);
        });

        if (files.length > 0) {
            loadDataset(files[0].download_url);
        }
    }

   function loadDataset(fileUrl) {
    console.log("Loading dataset from:", fileUrl);

    fetch(fileUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch dataset: ${response.statusText}`);
            }
            return response.text();
        })
        .then(csvText => {
            const rows = csvText.trim().split(/\\r?\\n/).map(row => row.split(","));
            if (rows.length > 0) {
                currentHeaders = rows.shift().map(header => header.trim());
                tableData = rows.map(row => row.map(cell => cell.trim())); // Assign to global tableData
                renderTable(currentHeaders, tableData);
            } else {
                console.error("No data found in the CSV file.");
            }
        })
        .catch(err => console.error("Error loading dataset:", err));
}

    function renderTable(headers, rows) {
        tableHeaders.innerHTML = "";
        headers.forEach((header, index) => {
            const th = document.createElement("th");
            th.textContent = header;
            th.style.cursor = "pointer"; // Indicate clickable headers
            th.addEventListener("click", () => {
                sortTableByColumn(index); // Sort on header click
            });
            tableHeaders.appendChild(th);
        });

        tableBody.innerHTML = "";
        rows.forEach(row => {
            const tr = document.createElement("tr");
            row.forEach((cell, index) => {
                const td = document.createElement("td");
                td.textContent = index > 1 ? formatNumberIfNeeded(cell) : cell; // Skip formatting for the first two columns
                tr.appendChild(td);
            });
            tableBody.appendChild(tr);
        });
    }

    function sortTableByColumn(columnIndex) {
        console.log(`Sorting column ${columnIndex}`);

        tableData.sort((a, b) => {
            const valA = a[columnIndex].replace(/[(),]/g, ""); // Remove formatting for comparison
            const valB = b[columnIndex].replace(/[(),]/g, "");

            const numA = parseFloat(valA);
            const numB = parseFloat(valB);

            if (!isNaN(numA) && !isNaN(numB)) {
                return sortDirection * (numA - numB);
            }
            return sortDirection * valA.localeCompare(valB);
        });

        sortDirection *= -1; // Toggle sort direction

        renderTable(currentHeaders, tableData); // Re-render the table
    }

    function formatNumberIfNeeded(value) {
        const numericValue = Number(value.replace(/[(),]/g, ""));
        if (!isNaN(numericValue)) {
            if (numericValue < 0) {
                return `(${Math.abs(numericValue).toLocaleString("en-US")})`;
            }
            return numericValue.toLocaleString("en-US");
        }
        return value;
    }

    fetchAvailableFiles();
});
