document.addEventListener("DOMContentLoaded", () => {
    const datasetSelect = document.getElementById("dataset-select");
    const searchInput = document.getElementById("table-filter");
    const tableHeaders = document.getElementById("table-headers");
    const tableBody = document.getElementById("table-body");
    const downloadButton = document.getElementById("download-button");

    let tableData = []; // To store the currently loaded table data
    let currentHeaders = []; // To store the headers

    // Example datasets
    const datasets = [
        { name: "Dataset 1", file: "data/dataset1.csv", uploadDate: "2024-11-20" },
        { name: "Dataset 2", file: "data/dataset2.csv", uploadDate: "2024-11-21" }
    ];

    datasets.forEach((dataset, index) => {
        const option = document.createElement("option");
        option.value = dataset.file;
        option.textContent = `${dataset.name} (Uploaded: ${dataset.uploadDate})`;
        datasetSelect.appendChild(option);

        if (index === 0) loadDataset(dataset.file);
    });

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

    function loadDataset(file) {
        fetch(file)
            .then(response => response.text())
            .then(csvText => {
                const rows = csvText.split("\n").map(row => row.split(","));
                currentHeaders = rows.shift(); // Save headers
                tableData = rows; // Save table data
                renderTable(currentHeaders, rows);
            })
            .catch(err => console.error("Error loading CSV:", err));
    }

    function renderTable(headers, rows) {
        tableHeaders.innerHTML = "";
        headers.forEach(header => {
            const th = document.createElement("th");
            th.textContent = header.trim();
            tableHeaders.appendChild(th);
        });

        renderTableBody(rows);
    }

    function renderTableBody(rows) {
        tableBody.innerHTML = "";
        rows.forEach(row => {
            const tr = document.createElement("tr");
            row.forEach(cell => {
                const td = document.createElement("td");
                td.textContent = cell.trim();
                tr.appendChild(td);
            });
            tableBody.appendChild(tr);
        });
    }

    function filterTable(query) {
        const filteredRows = tableData.filter(row =>
            row.some(cell => cell.toLowerCase().includes(query.toLowerCase()))
        );
        renderTableBody(filteredRows);
    }

    function downloadTableAsExcel() {
        const rows = [currentHeaders, ...tableData];
        const csvContent = rows.map(row => row.join(",")).join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "table_data.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
});
