document.addEventListener("DOMContentLoaded", () => {
    const datasetSelect = document.getElementById("dataset-select");
    const searchInput = document.getElementById("table-filter");
    const tableHeaders = document.getElementById("table-headers");
    const tableBody = document.getElementById("table-body");
    const downloadButton = document.getElementById("download-button");

    let tableData = []; // To store the currently loaded table data
    let currentHeaders = []; // To store the headers
    let currentSortColumn = null; // To track the column being sorted
    let sortAscending = true; // Sorting direction

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
                const headers = rows.shift();

                // Save the data
                tableData = rows;
                currentHeaders = headers;

                renderTable(headers, rows);
            })
            .catch(err => console.error("Error loading CSV:", err));
    }

    function renderTable(headers, rows) {
        // Render headers with sorting functionality
        tableHeaders.innerHTML = "";
        headers.forEach((header, index) => {
            const th = document.createElement("th");
            th.textContent = header.trim();
            th.style.cursor = "pointer";
            th.addEventListener("click", () => sortTable(index));
            tableHeaders.appendChild(th);
        });

        // Render table body
        renderTableBody(rows);
    }

    function renderTableBody(rows) {
        tableBody.innerHTML = "";
        rows.forEach(row => {
            const tr = document.createElement("tr");
            row.forEach((cell, columnIndex) => {
                const td = document.createElement("td");
                const columnName = currentHeaders[columnIndex].trim();
                const formattedCell =
                    columnName === "Governor ID" ? cell.trim() : formatNumber(cell.trim());
                td.textContent = formattedCell;
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

    function sortTable(columnIndex) {
        const columnName = tableHeaders.children[columnIndex].textContent.trim();
        const isNumeric = !isNaN(tableData[0][columnIndex]);

        tableData.sort((a, b) => {
            const aValue = isNumeric ? parseFloat(a[columnIndex]) : a[columnIndex].toLowerCase();
            const bValue = isNumeric ? parseFloat(b[columnIndex]) : b[columnIndex].toLowerCase();

            if (aValue > bValue) return sortAscending ? 1 : -1;
            if (aValue < bValue) return sortAscending ? -1 : 1;
            return 0;
        });

        sortAscending = currentSortColumn === columnIndex ? !sortAscending : true;
        currentSortColumn = columnIndex;

        renderTableBody(tableData);
    }

    function formatNumber(value) {
        if (!isNaN(value) && value !== "") {
            return parseInt(value, 10).toLocaleString("de-DE");
        }
        return value;
    }

    // Function to download the table as an Excel file
    function downloadTableAsExcel() {
        const rows = [currentHeaders, ...tableData];
        const csvContent = rows.map(row => row.join(",")).join("\n");

        // Create a Blob object for the CSV data
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

        // Create a temporary link element
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "table_data.csv");
        document.body.appendChild(link);

        // Trigger download and remove the link
        link.click();
        document.body.removeChild(link);
    }
});
