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

    fetch("/signup", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
    })
    .then(async response => {
        if (!response.ok) {
            if (response.status === 409) {
                alert("User already exists");
            } else if (response.status === 400) {
                alert("Missing username or password");
            } else {
                alert("Something went wrong. Try again.");
            }
            throw new Error("Request failed with status " + response.status);
        }

        const data = await response.json();
        if (data.success) {
            alert("Sign-up successful!");
            location.href = 'signin.html';
        }
    })
    .catch(error => {
        console.error("Error:", error);
        // Optionally display error alert only if not already handled
    });
});
