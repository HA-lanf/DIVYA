function togglePassword(event) {
    const passwordInput = document.getElementById('password');
    const btn = event.target;
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        btn.textContent = 'Hide Password';
    } else {
        passwordInput.type = 'password';
        btn.textContent = 'Show Password';
    }
}

document.querySelector("form").addEventListener("submit", function (event) {
    event.preventDefault();

    const username = document.querySelector("#username").value.trim();
    const password = document.querySelector("#password").value;

    if (!username || !password) {
        alert("Please enter both username and password.");
        return;
    }

    fetch("/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    })
    .then(response => {
        // Always try to parse the JSON response, regardless of response.ok
        // This allows us to read custom error messages from the backend (like "Invalid username or password")
        return response.json().then(data => ({
            status: response.status,
            ok: response.ok,
            data: data
        }));
    })
    .then(({ status, ok, data }) => {
        if (ok && data.success) { // If response was OK (2xx) and backend says success
            localStorage.setItem('username', username);
            window.location.href = `messagebox?username=${encodeURIComponent(username)}`;
        } else if (status === 401) { // Specifically handle 401 Unauthorized from backend
            alert("Invalid username or password");
        } else if (status === 400) { // Specifically handle 400 Bad Request
            alert(data.message || "Missing username or password (client-side validation failed).");
        }
        else { // Generic error for other non-2xx responses or if data.success is false for other reasons
            alert(data.message || "An error occurred during sign-in. Please try again.");
            console.error("Sign-in failed:", status, data);
        }
    })
    .catch(error => {
        console.error("Network or parsing error:", error);
        alert("A network error occurred. Please check your connection and try again.");
    });
});
