// Change this only if your controller has a different base URL.
const API = "/api/accounts";

const message = document.getElementById("message");

function showMessage(text, isError = false) {
    message.textContent = text;
    message.style.color = isError ? "#b91c1c" : "#15803d";
}

async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    const text = await response.text();
    let data = text;

    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        // Keep plain-text responses.
    }

    if (!response.ok) {
        throw new Error(
            typeof data === "string"
                ? data
                : data?.message || data?.error || `HTTP ${response.status}`
        );
    }

    return data;
}

// Display one account
function displayAccount(account) {
    const div = document.getElementById("accountDetails");
    div.replaceChildren();

    if (!account || typeof account !== "object") {
        div.textContent = "No account details returned.";
        return;
    }

    const details = [
        ["Account ID", account.id],
        ["Account Holder Name", account.accountHolderName],
        ["Balance", account.balance]
    ];

    details.forEach(([label, value]) => {
        const p = document.createElement("p");
        const strong = document.createElement("strong");

        strong.textContent = label + ": ";
        p.append(strong, document.createTextNode(value ?? "—"));

        div.appendChild(p);
    });
}

// CREATE ACCOUNT
document.getElementById("createForm")
    .addEventListener("submit", async function (event) {
        event.preventDefault();

        const account = {
            accountHolderName:
                document.getElementById("accountHolderName").value.trim(),
            balance:
                Number(document.getElementById("balance").value)
        };

        try {
            const result = await apiRequest(API, {
                method: "POST",
                body: JSON.stringify(account)
            });

            showMessage("Account created successfully!");

            if (result && typeof result === "object") {
                displayAccount(result);
            }

            this.reset();
            await loadAccounts();
        } catch (error) {
            showMessage("Create failed: " + error.message, true);
        }
    });

// GET ACCOUNT BY ID
document.getElementById("getForm")
    .addEventListener("submit", async function (event) {
        event.preventDefault();

        const id = document.getElementById("getId").value;

        try {
            const account = await apiRequest(
                `${API}/${encodeURIComponent(id)}`
            );

            displayAccount(account);
            showMessage("Account retrieved successfully!");
        } catch (error) {
            showMessage("Get account failed: " + error.message, true);
        }
    });

// DEPOSIT MONEY
document.getElementById("depositForm")
    .addEventListener("submit", async function (event) {
        event.preventDefault();

        const id = document.getElementById("depositId").value;
        const amount = Number(
            document.getElementById("depositAmount").value
        );

        if (!Number.isFinite(amount) || amount <= 0) {
            showMessage("Enter an amount greater than zero.", true);
            return;
        }

        try {
            const account = await apiRequest(
                `${API}/${encodeURIComponent(id)}/deposit`,
                {
                    method: "PUT",
                    body: JSON.stringify({ amount: amount })
                }
            );

            displayAccount(account);
            showMessage("Amount deposited successfully!");

            this.reset();
            await loadAccounts();
        } catch (error) {
            showMessage("Deposit failed: " + error.message, true);
        }
    });

// WITHDRAW MONEY
document.getElementById("withdrawForm")
    .addEventListener("submit", async function (event) {
        event.preventDefault();

        const id = document.getElementById("withdrawId").value;
        const amount = Number(
            document.getElementById("withdrawAmount").value
        );

        if (!Number.isFinite(amount) || amount <= 0) {
            showMessage("Enter an amount greater than zero.", true);
            return;
        }

        try {
            const account = await apiRequest(
                `${API}/${encodeURIComponent(id)}/withdraw`,
                {
                    method: "PUT",
                    body: JSON.stringify({ amount: amount })
                }
            );

            displayAccount(account);
            showMessage("Amount withdrawn successfully!");

            this.reset();
            await loadAccounts();
        } catch (error) {
            showMessage("Withdrawal failed: " + error.message, true);
        }
    });

// GET ALL ACCOUNTS
async function loadAccounts() {
    const table = document.getElementById("accountsTable");

    try {
        const result = await apiRequest(API);
        const accounts = Array.isArray(result) ? result : [];

        table.replaceChildren();

        if (accounts.length === 0) {
            const row = table.insertRow();
            const cell = row.insertCell();

            cell.colSpan = 3;
            cell.textContent = "No accounts found.";

            showMessage("No accounts available.");
            return;
        }

        accounts.forEach(account => {
            const row = table.insertRow();

            [
                account.id,
                account.accountHolderName,
                account.balance
            ].forEach(value => {
                const cell = row.insertCell();
                cell.textContent = value ?? "—";
            });
        });

        showMessage("All accounts loaded successfully!");
    } catch (error) {
        showMessage("Loading accounts failed: " + error.message, true);
    }
}

document.getElementById("loadAccounts")
    .addEventListener("click", loadAccounts);

// DELETE ACCOUNT
document.getElementById("deleteForm")
    .addEventListener("submit", async function (event) {
        event.preventDefault();

        const id = document.getElementById("deleteId").value;

        if (!confirm(`Delete account ${id}?`)) {
            return;
        }

        try {
            await apiRequest(
                `${API}/${encodeURIComponent(id)}`,
                { method: "DELETE" }
            );

            showMessage("Account deleted successfully!");

            document.getElementById("accountDetails").replaceChildren();

            this.reset();
            await loadAccounts();
        } catch (error) {
            showMessage("Delete failed: " + error.message, true);
        }
    });