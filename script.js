document.addEventListener("DOMContentLoaded", () => {
    const datasetSelect = document.getElementById("dataset-select");
    const tableHeaders = document.getElementById("table-headers");
    const tableBody = document.getElementById("table-body");

    const repoOwner = "WhiteTigger13";
    const repoName = "rok-stats";
    const branchName = "main";
    const dataPath = "data";

    const githubApiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${dataPath}?ref=${branchName}`;

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
                const rows = csvText.trim().split(/\r?\n/).map(row => row.split(","));
                if (rows.length > 0) {
                    const headers = rows.shift().map(header => header.trim());
                    const data = rows.map(row => row.map(cell => cell.trim()));
                    renderTable(headers, data);
                } else {
                    console.error("No data found in the CSV file.");
                }
            })
            .catch(err => console.error("Error loading dataset:", err));
    }

    function renderTable(headers, rows) {
        tableHeaders.innerHTML = "";
        headers.forEach(header => {
            const th = document.createElement("th");
            th.textContent = header;
            tableHeaders.appendChild(th);
        });

        tableBody.innerHTML = "";
        rows.forEach(row => {
            const tr = document.createElement("tr");
            row.forEach(cell => {
                const td = document.createElement("td");
                td.textContent = cell;
                tr.appendChild(td);
            });
            tableBody.appendChild(tr);
        });
    }

    fetchAvailableFiles();
});
